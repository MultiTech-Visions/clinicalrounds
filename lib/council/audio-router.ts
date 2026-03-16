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

export class AudioRouter {
  private ctx: AudioContext | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;

  // Per-session: the mix destination that feeds into that session's RTCPeerConnection
  private sessionMixes: Map<string, MediaStreamAudioDestinationNode> = new Map();
  // Per-session: source node from the session's remote audio
  private sessionSources: Map<string, MediaStreamAudioSourceNode> = new Map();
  // Per-session: gain node for volume control of remote audio
  private sessionGains: Map<string, GainNode> = new Map();

  // Master output for user's speakers
  private speakerGain: GainNode | null = null;

  async initialize(): Promise<void> {
    this.ctx = new AudioContext({ sampleRate: 24000 });

    // Master gain for speaker output
    this.speakerGain = this.ctx.createGain();
    this.speakerGain.gain.value = 1.0;
    this.speakerGain.connect(this.ctx.destination);

    // Get user microphone
    this.micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    this.micSource = this.ctx.createMediaStreamSource(this.micStream);
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

    // Create a destination node that will produce the mixed stream
    const mixDest = this.ctx.createMediaStreamDestination();
    this.sessionMixes.set(sessionId, mixDest);

    // Connect user mic to this session's input
    this.micSource.connect(mixDest);

    // Connect all EXISTING other sessions' remote audio to this new session's input
    for (const [otherId, otherSource] of this.sessionSources) {
      if (otherId !== sessionId) {
        const gain = this.ctx.createGain();
        gain.gain.value = 1.0;
        otherSource.connect(gain);
        gain.connect(mixDest);
      }
    }

    return mixDest.stream;
  }

  // Register a session's remote audio output (called when RTCPeerConnection gets remote track).
  // Routes it to: user speakers + all other sessions' input mixes.
  addRemoteAudio(sessionId: string, remoteStream: MediaStream): void {
    if (!this.ctx || !this.speakerGain) {
      throw new Error('AudioRouter not initialized');
    }

    const source = this.ctx.createMediaStreamSource(remoteStream);
    this.sessionSources.set(sessionId, source);

    // Gain for this session's output volume
    const gain = this.ctx.createGain();
    gain.gain.value = 1.0;
    this.sessionGains.set(sessionId, gain);

    source.connect(gain);

    // Route to user's speakers
    gain.connect(this.speakerGain);

    // Route to all OTHER sessions' input mixes (so they can hear this specialist)
    for (const [otherId, otherMix] of this.sessionMixes) {
      if (otherId !== sessionId) {
        const crossGain = this.ctx.createGain();
        crossGain.gain.value = 1.0;
        source.connect(crossGain);
        crossGain.connect(otherMix);
      }
    }
  }

  // Remove a session (cleanup when disconnecting a specialist)
  removeSession(sessionId: string): void {
    const source = this.sessionSources.get(sessionId);
    if (source) {
      source.disconnect();
      this.sessionSources.delete(sessionId);
    }
    const gain = this.sessionGains.get(sessionId);
    if (gain) {
      gain.disconnect();
      this.sessionGains.delete(gain as unknown as string);
    }
    const mix = this.sessionMixes.get(sessionId);
    if (mix) {
      // Don't disconnect — the RTCPeerConnection may still reference this
      this.sessionMixes.delete(sessionId);
    }
    this.sessionGains.delete(sessionId);
  }

  // Mute/unmute a specific session's output
  setSessionVolume(sessionId: string, volume: number): void {
    const gain = this.sessionGains.get(sessionId);
    if (gain) {
      gain.gain.value = Math.max(0, Math.min(1, volume));
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

  // Tear down everything
  destroy(): void {
    // Disconnect all sources
    for (const source of this.sessionSources.values()) {
      source.disconnect();
    }
    for (const gain of this.sessionGains.values()) {
      gain.disconnect();
    }
    this.micSource?.disconnect();

    // Stop mic tracks
    if (this.micStream) {
      for (const track of this.micStream.getTracks()) {
        track.stop();
      }
    }

    // Close audio context
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
    }

    this.sessionMixes.clear();
    this.sessionSources.clear();
    this.sessionGains.clear();
    this.ctx = null;
    this.micSource = null;
    this.micStream = null;
    this.speakerGain = null;
  }
}
