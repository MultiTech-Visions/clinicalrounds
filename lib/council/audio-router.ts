// Audio Router — Web Audio API mixer for multi-session voice routing
//
// Architecture:
//   User Mic ──────────────┬──→ Session A input mix ──→ RTCPeerConnection A
//                          ├──→ Session B input mix ──→ RTCPeerConnection B
//                          └──→ Session C input mix ──→ RTCPeerConnection C
//
//   Session A remote audio ─┬──→ User speakers (destination)
//                           ├──→ Session B input mix
//                           └──→ Session C input mix
//
//   Session B remote audio ─┬──→ User speakers (destination)
//                           ├──→ Session A input mix
//                           └──→ Session C input mix
//
// Each session's "input mix" = user mic + all OTHER sessions' outputs.
// This way each specialist hears the human and all other specialists.

interface SessionAudioState {
  mix: MediaStreamAudioDestinationNode;
  micGain: GainNode; // per-session mic → mix gain (so we can disconnect cleanly)
  source: MediaStreamAudioSourceNode | null;
  speakerGain: GainNode | null;
  // All gain nodes created for cross-routing, keyed by the target/source session ID
  crossGains: Map<string, GainNode>;
}

export class AudioRouter {
  private ctx: AudioContext | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private sessions: Map<string, SessionAudioState> = new Map();
  private speakerGain: GainNode | null = null;
  private _destroyed = false;

  async initialize(): Promise<void> {
    if (this.ctx) {
      // Already initialized — avoid double-init leak
      return;
    }

    this.ctx = new AudioContext({ sampleRate: 24000 });

    // Master gain for speaker output
    this.speakerGain = this.ctx.createGain();
    this.speakerGain.gain.value = 1.0;
    this.speakerGain.connect(this.ctx.destination);

    // Get user microphone
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);
    } catch (err) {
      // Clean up the AudioContext since we can't proceed without a mic
      if (this.ctx.state !== 'closed') {
        this.ctx.close().catch(() => {});
      }
      this.ctx = null;
      this.speakerGain = null;
      throw err;
    }
  }

  get audioContext(): AudioContext | null {
    return this.ctx;
  }

  get isInitialized(): boolean {
    return this.ctx !== null && this.micSource !== null;
  }

  // Create the input mix stream for a new session.
  // Returns the MediaStream to use as the audio track for RTCPeerConnection.
  createSessionInput(sessionId: string): MediaStream {
    if (!this.ctx || !this.micSource) {
      throw new Error('AudioRouter not initialized');
    }

    // Guard against duplicate session IDs
    if (this.sessions.has(sessionId)) {
      this.removeSession(sessionId);
    }

    // Create a destination node that will produce the mixed stream
    const mix = this.ctx.createMediaStreamDestination();

    // Use a per-session gain for mic → mix so we can disconnect cleanly
    const micGain = this.ctx.createGain();
    micGain.gain.value = 1.0;
    this.micSource.connect(micGain);
    micGain.connect(mix);

    const state: SessionAudioState = {
      mix,
      micGain,
      source: null,
      speakerGain: null,
      crossGains: new Map(),
    };
    this.sessions.set(sessionId, state);

    // Connect all EXISTING other sessions' remote audio to this new session's input
    for (const [otherId, otherState] of this.sessions) {
      if (otherId !== sessionId && otherState.source) {
        const gain = this.ctx.createGain();
        gain.gain.value = 1.0;
        otherState.source.connect(gain);
        gain.connect(mix);
        // Track this gain node on the SOURCE session so we can clean it up
        otherState.crossGains.set(sessionId, gain);
      }
    }

    return mix.stream;
  }

  // Register a session's remote audio output (called when RTCPeerConnection gets remote track).
  // Routes it to: user speakers + all other sessions' input mixes.
  addRemoteAudio(sessionId: string, remoteStream: MediaStream): void {
    if (!this.ctx || !this.speakerGain) {
      throw new Error('AudioRouter not initialized');
    }

    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error(`Session ${sessionId} not found in audio router`);
    }

    // Guard against duplicate ontrack calls — disconnect previous source if any
    if (state.source) {
      state.source.disconnect();
    }
    if (state.speakerGain) {
      state.speakerGain.disconnect();
    }

    const source = this.ctx.createMediaStreamSource(remoteStream);
    state.source = source;

    // Gain for this session's output volume (controls speaker + all cross-routes)
    const gain = this.ctx.createGain();
    gain.gain.value = 1.0;
    state.speakerGain = gain;

    source.connect(gain);

    // Route to user's speakers
    gain.connect(this.speakerGain);

    // Route to all OTHER sessions' input mixes (so they can hear this specialist)
    for (const [otherId, otherState] of this.sessions) {
      if (otherId !== sessionId) {
        const crossGain = this.ctx.createGain();
        crossGain.gain.value = 1.0;
        source.connect(crossGain);
        crossGain.connect(otherState.mix);
        // Track on THIS session so cleanup disconnects it
        state.crossGains.set(otherId, crossGain);
      }
    }
  }

  // Remove a session (cleanup when disconnecting a specialist)
  removeSession(sessionId: string): void {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    // Disconnect this session's source and all its nodes
    if (state.source) {
      state.source.disconnect();
    }
    if (state.speakerGain) {
      state.speakerGain.disconnect();
    }
    // Disconnect the per-session mic gain (prevents mic→removed mix leak)
    state.micGain.disconnect();

    for (const gain of state.crossGains.values()) {
      gain.disconnect();
    }

    // Also clean up cross-gains that OTHER sessions have pointing to this session's mix
    for (const [otherId, otherState] of this.sessions) {
      if (otherId !== sessionId) {
        const crossGain = otherState.crossGains.get(sessionId);
        if (crossGain) {
          crossGain.disconnect();
          otherState.crossGains.delete(sessionId);
        }
      }
    }

    this.sessions.delete(sessionId);
  }

  // Mute/unmute a specific session's output
  setSessionVolume(sessionId: string, volume: number): void {
    const state = this.sessions.get(sessionId);
    if (state?.speakerGain) {
      state.speakerGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Mute/unmute the user's microphone
  setMicMuted(muted: boolean): void {
    if (this.micStream) {
      for (const track of this.micStream.getAudioTracks()) {
        track.enabled = !muted;
      }
    }
  }

  // Set master speaker volume
  setSpeakerVolume(volume: number): void {
    if (this.speakerGain) {
      this.speakerGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Tear down everything — idempotent
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    for (const state of this.sessions.values()) {
      state.source?.disconnect();
      state.speakerGain?.disconnect();
      state.micGain.disconnect();
      for (const gain of state.crossGains.values()) {
        gain.disconnect();
      }
    }
    this.sessions.clear();

    this.micSource?.disconnect();

    // Stop mic tracks
    if (this.micStream) {
      for (const track of this.micStream.getTracks()) {
        track.stop();
      }
    }

    // Close audio context
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }

    this.ctx = null;
    this.micSource = null;
    this.micStream = null;
    this.speakerGain = null;
  }
}
