/* ═══════════════════════════════════════════════════════════════════
   Voice Council — Client-side JavaScript
   ClinicalRounds multidisciplinary real-time voice council
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

// ─── Specialist Metadata ───────────────────────────────────────────

const COUNCIL_MEMBERS = {
  attending:       { name: 'Chief',   title: 'Attending Hospitalist & Council Leader', voice: 'ash',     color: '#8B5CF6' },
  cardiologist:    { name: 'Cardi',   title: 'Cardiologist',                           voice: 'coral',   color: '#EF4444' },
  pulmonologist:   { name: 'Breezy',  title: 'Pulmonologist',                          voice: 'shimmer', color: '#06B6D4' },
  nephrologist:    { name: 'Rio',     title: 'Nephrologist',                           voice: 'echo',    color: '#3B82F6' },
  hepatologist:    { name: 'Liv',     title: 'Hepatologist',                           voice: 'sage',    color: '#84CC16' },
  hematologist:    { name: 'Ruby',    title: 'Hematologist',                           voice: 'ballad',  color: '#DC2626' },
  id_specialist:   { name: 'Scout',   title: 'ID Specialist',                          voice: 'verse',   color: '#F59E0B' },
  radiologist:     { name: 'Ray',     title: 'Radiologist',                            voice: 'alloy',   color: '#6366F1' },
  pharmacist:      { name: 'Rex',     title: 'Clinical Pharmacist',                    voice: 'verse',   color: '#10B981' },
  endocrinologist: { name: 'Harmony', title: 'Endocrinologist',                        voice: 'alloy',   color: '#EC4899' },
  neurologist:     { name: 'Nova',    title: 'Neurologist',                            voice: 'coral',   color: '#A855F7' },
  intensivist:     { name: 'Vigil',   title: 'Critical Care Intensivist',              voice: 'ballad',  color: '#F97316' },
  oncologist:      { name: 'Archer',  title: 'Oncologist',                             voice: 'echo',    color: '#14B8A6' },
  psychiatrist:    { name: 'Sage',    title: 'Psychiatrist',                           voice: 'sage',    color: '#7C3AED' },
  toxicologist:    { name: 'Vex',     title: 'Toxicologist',                           voice: 'ash',     color: '#FBBF24' },
  palliative:      { name: 'Grace',   title: 'Palliative Care Specialist',             voice: 'shimmer', color: '#F9A8D4' },
};

// ─── Parliamentary Tools ───────────────────────────────────────────

const COUNCIL_TOOLS = [
  {
    type: 'function',
    name: 'post_to_chat',
    description: 'Post formatted HTML to the shared chat viewport visible to all council members and the clinician.',
    parameters: {
      type: 'object',
      properties: {
        html: { type: 'string', description: 'Clean HTML content' },
        label: { type: 'string', description: 'Brief label' }
      },
      required: ['html', 'label']
    }
  },
  {
    type: 'function',
    name: 'request_floor',
    description: 'Raise hand to request permission to speak. Use when you have something important to contribute but someone else is currently speaking.',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Brief topic (1-5 words)' }
      },
      required: ['topic']
    }
  },
  {
    type: 'function',
    name: 'point_of_order',
    description: 'Interrupt for urgent clinical safety concern. Use ONLY for critical safety issues that cannot wait (e.g., dangerous drug interaction, missed contraindication, life-threatening diagnosis being overlooked).',
    parameters: {
      type: 'object',
      properties: {
        concern: { type: 'string', description: 'The specific clinical safety concern' }
      },
      required: ['concern']
    }
  }
];

// ─── System Prompt Builder ─────────────────────────────────────────

function buildSystemPrompt(memberKey, allMemberKeys, isLeader, caseContext) {
  const member = COUNCIL_MEMBERS[memberKey];
  const roster = allMemberKeys.map(k => {
    const m = COUNCIL_MEMBERS[k];
    return `  - ${m.name} (${m.title})${k === memberKey ? ' [YOU]' : ''}`;
  }).join('\n');

  let prompt = `You are Dr. ${member.name}, a ${member.title}, participating in a live multidisciplinary clinical case council.

## YOUR IDENTITY
- Name: Dr. ${member.name}
- Role: ${member.title}
- You are a real-time voice participant in this council. Speak naturally and conversationally.
- Address other council members by their names (e.g., "I agree with Dr. Ruby's point about...").

## COUNCIL ROSTER
The following specialists are present in this session:
${roster}

## YOUR EXPERTISE
You bring deep domain knowledge in your specialty. Contribute insights that are specific to your field. When another specialist raises a point outside your domain, defer to them but note cross-specialty interactions you notice (e.g., drug-drug interactions, competing treatment goals).

## PARLIAMENTARY PROCEDURE
This council follows modified parliamentary rules to ensure orderly, productive discussion:

1. **Orderly Discussion**: Listen to the current speaker before responding. Do not talk over others.
2. **Stay On Topic**: Keep contributions relevant to the clinical case at hand.
3. **Evidence-Based**: Support recommendations with guidelines, evidence, or clinical reasoning. State the strength of evidence when relevant.
4. **Constructive Disagreement**: If you disagree with another specialist, state your reasoning respectfully. Say "I have a different perspective because..." rather than simply contradicting.
5. **Cross-Specialty Awareness**: Flag interactions between your domain and others (e.g., renal dosing of cardiac medications, neuropsychiatric effects of medications).
6. **Brevity**: Keep spoken contributions concise (30-60 seconds of speech). Use the post_to_chat tool for detailed tables, lists, or references.
7. **Tool Usage**:
   - Use \`post_to_chat\` to share detailed analysis, differential diagnoses, tables, or reference material with the team.
   - Use \`request_floor\` when you want to speak but someone else is talking. State your topic briefly.
   - Use \`point_of_order\` ONLY for urgent patient safety concerns that cannot wait for the current speaker to finish.

## VOICE INTERACTION NOTES
- You are communicating via real-time voice. Keep your spoken responses conversational and natural.
- For complex information (drug dosing tables, differential diagnoses, detailed plans), use post_to_chat to put it in writing while giving a brief verbal summary.
- Listen to the clinician's questions and the other specialists' contributions carefully.
- If the clinician addresses you directly, respond promptly and specifically.
- If asked about something outside your expertise, say so and suggest which specialist should weigh in.
`;

  if (isLeader) {
    prompt += `
## COUNCIL CHAIR ADDENDUM
You have been designated as the Council Chair for this session. In addition to your specialist role, you have the following responsibilities:

1. **Opening**: Begin the session by briefly acknowledging the council members present, summarizing the case if context was provided, and inviting the clinician to present or ask their question.
2. **Floor Management**:
   - Recognize specialists who use \`request_floor\` — call on them by name.
   - If discussion becomes disorganized, gently redirect: "Let's hear from Dr. [Name] on this point."
   - Ensure all relevant specialties get a chance to contribute.
3. **Synthesis**:
   - Periodically summarize key points and areas of agreement/disagreement.
   - After major discussion segments, use post_to_chat to provide a written summary.
4. **Time Management**: Keep the discussion moving. If a topic is exhausted, move to the next issue.
5. **Safety Oversight**: Acknowledge any point_of_order immediately and ensure the concern is addressed before continuing.
6. **Closing**: When the clinician indicates they're done, provide a final synthesis of recommendations, outstanding questions, and suggested next steps. Post this to chat as well.
7. **Conflict Resolution**: When specialists disagree, help frame the disagreement clearly: "So Dr. A recommends X because of Y, while Dr. B prefers Z because of W. The key question is..."
`;
  }

  if (caseContext && caseContext.trim()) {
    prompt += `
## CASE CONTEXT
The clinician has provided the following clinical notes/context for this session:

---
${caseContext.trim()}
---

Review this information carefully. Be prepared to provide your specialty-specific assessment when called upon.
`;
  }

  return prompt;
}

// ─── HTML Sanitizer ────────────────────────────────────────────────

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'a', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'hr', 'div', 'blockquote', 'pre', 'code', 'sub', 'sup'
]);

const ALLOWED_ATTRS = new Set(['href', 'target', 'class', 'colspan', 'rowspan']);
const MAX_HTML_SIZE = 50 * 1024; // 50KB

function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';
  if (html.length > MAX_HTML_SIZE) {
    html = html.slice(0, MAX_HTML_SIZE) + '... [truncated]';
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');

  function clean(node) {
    if (node.nodeType === Node.TEXT_NODE) return node.cloneNode();
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const tag = node.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      // Keep text content but strip the tag
      const fragment = document.createDocumentFragment();
      for (const child of node.childNodes) {
        const cleaned = clean(child);
        if (cleaned) fragment.appendChild(cleaned);
      }
      return fragment;
    }

    const el = document.createElement(tag);

    // Copy only allowed attributes
    for (const attr of node.attributes) {
      if (ALLOWED_ATTRS.has(attr.name.toLowerCase())) {
        // Never allow javascript: URLs
        if (attr.name === 'href' && /^\s*javascript:/i.test(attr.value)) continue;
        el.setAttribute(attr.name, attr.value);
      }
    }

    // Force target="_blank" on links
    if (tag === 'a') {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }

    for (const child of node.childNodes) {
      const cleaned = clean(child);
      if (cleaned) el.appendChild(cleaned);
    }

    return el;
  }

  const fragment = document.createDocumentFragment();
  for (const child of doc.body.childNodes) {
    const cleaned = clean(child);
    if (cleaned) fragment.appendChild(cleaned);
  }

  const wrapper = document.createElement('div');
  wrapper.appendChild(fragment);
  return wrapper.innerHTML;
}

// ─── AudioRouter ───────────────────────────────────────────────────

class AudioRouter {
  constructor() {
    this.audioContext = null;
    this.micStream = null;
    this.micSource = null;
    this.micGain = null;
    this.speakerGain = null;
    this.sessionMixes = new Map();  // specialist -> { destination, gainNode }
    this.remoteStreams = new Map(); // specialist -> { source, gainNode }
    this.speakerDestination = null;
  }

  async initialize() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });

    // Request microphone
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000,
        }
      });
    } catch (err) {
      console.error('Microphone access denied:', err);
      throw new Error('Microphone access is required for the Voice Council.');
    }

    this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
    this.micGain = this.audioContext.createGain();
    this.micGain.gain.value = 1.0;
    this.micSource.connect(this.micGain);

    // Master speaker gain
    this.speakerGain = this.audioContext.createGain();
    this.speakerGain.gain.value = 1.0;
    this.speakerGain.connect(this.audioContext.destination);
  }

  /**
   * Create a mix destination for a specialist session.
   * The mix includes: human mic + all OTHER specialists' remote audio.
   * Returns a MediaStream to add as a track to the RTCPeerConnection.
   */
  createSessionInput(specialist) {
    const dest = this.audioContext.createMediaStreamDestination();
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1.0;
    gainNode.connect(dest);

    // Connect human mic to this session's input
    this.micGain.connect(gainNode);

    // Connect any already-added remote streams from OTHER specialists
    for (const [key, remote] of this.remoteStreams) {
      if (key !== specialist) {
        remote.gainNode.connect(gainNode);
      }
    }

    this.sessionMixes.set(specialist, { destination: dest, gainNode });
    return dest.stream;
  }

  /**
   * Route a specialist's remote audio output to:
   * 1. The speakers (so the clinician can hear)
   * 2. All OTHER specialists' session input mixes (so they can hear each other)
   */
  addRemoteAudio(specialist, stream) {
    if (!this.audioContext) return;

    const source = this.audioContext.createMediaStreamSource(stream);
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1.0;
    source.connect(gainNode);

    // Route to speakers
    gainNode.connect(this.speakerGain);

    // Route to all OTHER sessions' input mixes
    for (const [key, mix] of this.sessionMixes) {
      if (key !== specialist) {
        gainNode.connect(mix.gainNode);
      }
    }

    this.remoteStreams.set(specialist, { source, gainNode });
  }

  removeSession(specialist) {
    const mix = this.sessionMixes.get(specialist);
    if (mix) {
      try { mix.gainNode.disconnect(); } catch (_) {}
      this.sessionMixes.delete(specialist);
    }

    const remote = this.remoteStreams.get(specialist);
    if (remote) {
      try { remote.gainNode.disconnect(); } catch (_) {}
      try { remote.source.disconnect(); } catch (_) {}
      this.remoteStreams.delete(specialist);
    }
  }

  setMicMuted(muted) {
    if (this.micGain) {
      this.micGain.gain.value = muted ? 0 : 1;
    }
  }

  setSpeakerVolume(volume) {
    if (this.speakerGain) {
      this.speakerGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  destroy() {
    // Stop mic tracks
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
    }

    // Disconnect everything
    for (const [key] of this.sessionMixes) {
      this.removeSession(key);
    }

    if (this.micSource) try { this.micSource.disconnect(); } catch (_) {}
    if (this.micGain) try { this.micGain.disconnect(); } catch (_) {}
    if (this.speakerGain) try { this.speakerGain.disconnect(); } catch (_) {}

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }

    this.audioContext = null;
    this.micStream = null;
    this.sessionMixes.clear();
    this.remoteStreams.clear();
  }
}

// ─── RealtimeSession ───────────────────────────────────────────────

class RealtimeSession {
  constructor(specialist, allSpecialists, isLeader, caseContext, audioRouter, callbacks) {
    this.specialist = specialist;
    this.allSpecialists = allSpecialists;
    this.isLeader = isLeader;
    this.caseContext = caseContext;
    this.audioRouter = audioRouter;
    this.callbacks = callbacks; // { onStatusChange, onChatMessage, onTranscript, onError }

    this.member = COUNCIL_MEMBERS[specialist];
    this.pc = null;
    this.dc = null;
    this.status = 'connecting';
    this.pendingToolCalls = new Map();
    this.currentTranscript = '';
  }

  async connect() {
    this._setStatus('connecting');

    try {
      // 1. Build system prompt
      const systemPrompt = buildSystemPrompt(
        this.specialist, this.allSpecialists, this.isLeader, this.caseContext
      );

      // 2. Get ephemeral token
      const tokenRes = await fetch('/api/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specialist: this.specialist })
      });

      if (!tokenRes.ok) {
        throw new Error(`Token request failed: ${tokenRes.status} ${tokenRes.statusText}`);
      }

      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.client_secret?.value || tokenData.key || tokenData.client_secret;

      if (!ephemeralKey) {
        throw new Error('No ephemeral key in token response');
      }

      // 3. Create RTCPeerConnection
      this.pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      // 4. Get audio input from AudioRouter and add track
      const inputStream = this.audioRouter.createSessionInput(this.specialist);
      const audioTrack = inputStream.getAudioTracks()[0];
      if (audioTrack) {
        this.pc.addTrack(audioTrack, inputStream);
      }

      // 5. Handle remote audio track
      this.pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.audioRouter.addRemoteAudio(this.specialist, event.streams[0]);
        }
      };

      // 6. Create data channel
      this.dc = this.pc.createDataChannel('oai-events');
      this.dc.onopen = () => {
        this._setStatus('connected');

        // Send session.update with system prompt, tools, and voice config
        this._sendDCEvent({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: systemPrompt,
            voice: this.member.voice,
            input_audio_transcription: { model: 'whisper-1' },
            tools: COUNCIL_TOOLS,
            tool_choice: 'auto',
            temperature: 0.7,
          }
        });
      };

      this.dc.onmessage = (event) => {
        this._handleDCMessage(event);
      };

      this.dc.onclose = () => {
        if (this.status !== 'disconnected') {
          this._setStatus('disconnected');
        }
      };

      this.dc.onerror = (err) => {
        console.error(`[${this.specialist}] Data channel error:`, err);
        this._setStatus('error');
      };

      // 7. ICE connection state monitoring
      this.pc.oniceconnectionstatechange = () => {
        if (this.pc.iceConnectionState === 'failed' || this.pc.iceConnectionState === 'disconnected') {
          this._setStatus('disconnected');
        }
      };

      // 8. Create SDP offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // 9. POST offer to OpenAI Realtime API
      const sdpRes = await fetch(
        'https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ephemeralKey}`,
            'Content-Type': 'application/sdp',
          },
          body: offer.sdp,
        }
      );

      if (!sdpRes.ok) {
        throw new Error(`SDP exchange failed: ${sdpRes.status} ${sdpRes.statusText}`);
      }

      const answerSdp = await sdpRes.text();
      await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });

    } catch (err) {
      console.error(`[${this.specialist}] Connection failed:`, err);
      this._setStatus('error');
      if (this.callbacks.onError) {
        this.callbacks.onError(this.specialist, err.message);
      }
    }
  }

  _sendDCEvent(event) {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify(event));
    }
  }

  _handleDCMessage(event) {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    switch (msg.type) {
      // ── Audio speech started / stopped ──
      case 'output_audio_buffer.speech_started':
        this._setStatus('speaking');
        break;

      case 'output_audio_buffer.speech_stopped':
      case 'response.audio.done':
        if (this.status === 'speaking') {
          this._setStatus('connected');
        }
        break;

      // ── Input speech detection ──
      case 'input_audio_buffer.speech_started':
        this._setStatus('listening');
        break;

      case 'input_audio_buffer.speech_stopped':
        if (this.status === 'listening') {
          this._setStatus('connected');
        }
        break;

      // ── Transcript deltas ──
      case 'response.audio_transcript.delta':
        if (msg.delta) {
          this.currentTranscript += msg.delta;
          if (this.callbacks.onTranscript) {
            this.callbacks.onTranscript(this.specialist, this.currentTranscript, false);
          }
        }
        break;

      case 'response.audio_transcript.done':
        if (this.currentTranscript.trim()) {
          if (this.callbacks.onTranscript) {
            this.callbacks.onTranscript(this.specialist, this.currentTranscript, true);
          }
        }
        this.currentTranscript = '';
        break;

      // ── Tool calls ──
      case 'response.function_call_arguments.delta':
        if (msg.call_id) {
          const existing = this.pendingToolCalls.get(msg.call_id) || { name: '', args: '' };
          existing.args += (msg.delta || '');
          if (msg.name) existing.name = msg.name;
          this.pendingToolCalls.set(msg.call_id, existing);
        }
        break;

      case 'response.function_call_arguments.done':
        if (msg.call_id) {
          const pending = this.pendingToolCalls.get(msg.call_id);
          const toolName = msg.name || (pending && pending.name) || '';
          const argsStr = msg.arguments || (pending && pending.args) || '{}';
          this.pendingToolCalls.delete(msg.call_id);
          this._handleToolCall(msg.call_id, toolName, argsStr);
        }
        break;

      // ── Response done / errors ──
      case 'response.done':
        if (this.status === 'speaking') {
          this._setStatus('connected');
        }
        break;

      case 'error':
        console.error(`[${this.specialist}] API error:`, msg.error);
        if (this.callbacks.onError) {
          this.callbacks.onError(this.specialist, msg.error?.message || 'Unknown API error');
        }
        break;

      default:
        break;
    }
  }

  _handleToolCall(callId, name, argsStr) {
    let args;
    try {
      args = JSON.parse(argsStr);
    } catch {
      args = {};
    }

    let result = '';

    switch (name) {
      case 'post_to_chat': {
        const safeHtml = sanitizeHTML(args.html || '');
        if (this.callbacks.onChatMessage) {
          this.callbacks.onChatMessage({
            type: 'specialist',
            specialist: this.specialist,
            html: safeHtml,
            label: args.label || '',
            timestamp: Date.now(),
          });
        }
        result = 'Posted to chat successfully.';
        break;
      }

      case 'request_floor': {
        this._setStatus('hand_raised');
        if (this.callbacks.onChatMessage) {
          this.callbacks.onChatMessage({
            type: 'hand_raised',
            specialist: this.specialist,
            topic: args.topic || '',
            timestamp: Date.now(),
          });
        }
        result = `Hand raised. The chair will recognize you to speak about: ${args.topic}`;
        break;
      }

      case 'point_of_order': {
        if (this.callbacks.onChatMessage) {
          this.callbacks.onChatMessage({
            type: 'point_of_order',
            specialist: this.specialist,
            concern: args.concern || '',
            timestamp: Date.now(),
          });
        }
        result = 'Point of order acknowledged. The council will address this safety concern immediately.';
        break;
      }

      default:
        result = `Unknown tool: ${name}`;
    }

    // Send tool result back
    this._sendDCEvent({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: result,
      }
    });

    // Trigger response generation after tool output
    this._sendDCEvent({ type: 'response.create' });
  }

  _setStatus(status) {
    this.status = status;
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(this.specialist, status);
    }
  }

  sendText(text) {
    this._sendDCEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    });
    this._sendDCEvent({ type: 'response.create' });
  }

  sendImage(base64, mimeType) {
    this._sendDCEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          { type: 'input_text', text: 'The clinician has shared an image. Please review it and provide your specialist assessment.' },
          { type: 'input_image', image: base64, mime_type: mimeType }
        ]
      }
    });
    this._sendDCEvent({ type: 'response.create' });
  }

  sendSystemEvent(text) {
    this._sendDCEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: `[SYSTEM] ${text}` }]
      }
    });
    this._sendDCEvent({ type: 'response.create' });
  }

  disconnect() {
    this._setStatus('disconnected');

    if (this.dc) {
      try { this.dc.close(); } catch (_) {}
      this.dc = null;
    }

    if (this.pc) {
      try { this.pc.close(); } catch (_) {}
      this.pc = null;
    }

    this.audioRouter.removeSession(this.specialist);
  }
}

// ─── CouncilManager ────────────────────────────────────────────────

class CouncilManager {
  constructor() {
    this.audioRouter = null;
    this.sessions = new Map(); // specialist -> RealtimeSession
    this.leader = null;
    this.active = false;

    // Callbacks to be set by the UI
    this.onMemberStatusChange = null;
    this.onChatMessage = null;
    this.onTranscript = null;
    this.onError = null;
    this.onReady = null;
  }

  async initialize(specialists, leader, caseContext) {
    this.leader = leader;
    this.active = true;

    // Initialize audio router
    this.audioRouter = new AudioRouter();
    await this.audioRouter.initialize();

    const allSpecialists = [...specialists];

    // Create callbacks for sessions
    const sessionCallbacks = {
      onStatusChange: (specialist, status) => {
        if (this.onMemberStatusChange) {
          this.onMemberStatusChange(specialist, status);
        }
      },
      onChatMessage: (msg) => {
        if (this.onChatMessage) {
          this.onChatMessage(msg);
        }
      },
      onTranscript: (specialist, text, done) => {
        if (this.onTranscript) {
          this.onTranscript(specialist, text, done);
        }
      },
      onError: (specialist, error) => {
        if (this.onError) {
          this.onError(specialist, error);
        }
      }
    };

    // Create all sessions
    for (const spec of allSpecialists) {
      const session = new RealtimeSession(
        spec, allSpecialists, spec === leader, caseContext,
        this.audioRouter, sessionCallbacks
      );
      this.sessions.set(spec, session);
    }

    // Connect all in parallel
    const connectPromises = [];
    for (const [, session] of this.sessions) {
      connectPromises.push(
        session.connect().catch(err => {
          console.error(`Failed to connect ${session.specialist}:`, err);
        })
      );
    }

    await Promise.all(connectPromises);

    if (this.onReady) {
      this.onReady();
    }
  }

  sendTextToAll(text) {
    for (const [, session] of this.sessions) {
      if (session.status === 'connected' || session.status === 'speaking' || session.status === 'listening' || session.status === 'hand_raised') {
        session.sendText(text);
      }
    }
  }

  sendTextTo(specialist, text) {
    const session = this.sessions.get(specialist);
    if (session) {
      session.sendText(text);
    }
  }

  sendImageToAll(base64, mimeType) {
    for (const [, session] of this.sessions) {
      if (session.status === 'connected' || session.status === 'speaking' || session.status === 'listening' || session.status === 'hand_raised') {
        session.sendImage(base64, mimeType);
      }
    }
  }

  sendSystemEventToAll(text) {
    for (const [, session] of this.sessions) {
      if (session.status !== 'disconnected' && session.status !== 'error') {
        session.sendSystemEvent(text);
      }
    }
  }

  setMicMuted(muted) {
    if (this.audioRouter) {
      this.audioRouter.setMicMuted(muted);
    }
  }

  destroy() {
    this.active = false;

    for (const [, session] of this.sessions) {
      session.disconnect();
    }
    this.sessions.clear();

    if (this.audioRouter) {
      this.audioRouter.destroy();
      this.audioRouter = null;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  UI CONTROLLER
// ═══════════════════════════════════════════════════════════════════

(function () {
  // ── State ──
  let selectedSpecialists = new Set();
  let councilManager = null;
  let micMuted = false;
  let speakerOn = true;
  let transcriptElements = new Map(); // specialist -> DOM element for live transcript

  // ── DOM refs ──
  const setupPhase = document.getElementById('setup-phase');
  const activePhase = document.getElementById('active-phase');
  const specialistGrid = document.getElementById('specialist-grid');
  const caseContextInput = document.getElementById('case-context');
  const councilChairSelect = document.getElementById('council-chair');
  const btnSelectAll = document.getElementById('btn-select-all');
  const btnClear = document.getElementById('btn-clear');
  const btnStart = document.getElementById('btn-start');
  const connDot = document.getElementById('conn-dot');
  const connText = document.getElementById('conn-text');
  const memberList = document.getElementById('member-list');
  const chatViewport = document.getElementById('chat-viewport');
  const chatInput = document.getElementById('chat-input');
  const btnSend = document.getElementById('btn-send');
  const btnMic = document.getElementById('btn-mic');
  const btnSpeaker = document.getElementById('btn-speaker');
  const btnEnd = document.getElementById('btn-end');
  const btnUploadTrigger = document.getElementById('btn-upload-trigger');
  const fileInput = document.getElementById('file-input');

  // ── Render Setup ──

  function renderSetup() {
    specialistGrid.innerHTML = '';

    for (const [key, member] of Object.entries(COUNCIL_MEMBERS)) {
      const card = document.createElement('div');
      card.className = 'council-card';
      card.dataset.specialist = key;

      card.innerHTML = `
        <div class="checkmark">&#x2713;</div>
        <div class="card-name">
          <span class="color-dot" style="background:${member.color}"></span>
          Dr. ${member.name}
        </div>
        <div class="card-title">${member.title}</div>
      `;

      card.addEventListener('click', () => toggleSpecialist(key, card));
      specialistGrid.appendChild(card);
    }
  }

  function toggleSpecialist(key, card) {
    if (selectedSpecialists.has(key)) {
      selectedSpecialists.delete(key);
      card.classList.remove('selected');
    } else {
      selectedSpecialists.add(key);
      card.classList.add('selected');
    }
    updateChairDropdown();
    updateStartButton();
  }

  function updateChairDropdown() {
    const currentValue = councilChairSelect.value;
    councilChairSelect.innerHTML = '<option value="">Select a chair...</option>';

    for (const key of selectedSpecialists) {
      const member = COUNCIL_MEMBERS[key];
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `Dr. ${member.name} — ${member.title}`;
      councilChairSelect.appendChild(opt);
    }

    // Restore selection if still valid
    if (selectedSpecialists.has(currentValue)) {
      councilChairSelect.value = currentValue;
    } else if (selectedSpecialists.size > 0) {
      // Default to first selected
      councilChairSelect.value = [...selectedSpecialists][0];
    }
  }

  function updateStartButton() {
    btnStart.disabled = selectedSpecialists.size < 2;
  }

  // ── Select All / Clear ──

  btnSelectAll.addEventListener('click', () => {
    selectedSpecialists = new Set(Object.keys(COUNCIL_MEMBERS));
    document.querySelectorAll('.council-card').forEach(c => c.classList.add('selected'));
    updateChairDropdown();
    updateStartButton();
  });

  btnClear.addEventListener('click', () => {
    selectedSpecialists.clear();
    document.querySelectorAll('.council-card').forEach(c => c.classList.remove('selected'));
    updateChairDropdown();
    updateStartButton();
  });

  // ── Start Council ──

  btnStart.addEventListener('click', async () => {
    const specs = [...selectedSpecialists];
    const chair = councilChairSelect.value || specs[0];
    const caseContext = caseContextInput.value;

    if (specs.length < 2) return;

    // Switch to active phase
    setupPhase.style.display = 'none';
    activePhase.classList.add('visible');

    // Render member list
    renderMemberList(specs, chair);

    // Add system message
    addMessage({ type: 'system', text: `Council session starting with ${specs.length} specialists. Chair: Dr. ${COUNCIL_MEMBERS[chair].name}.` });

    // Update connection status
    connDot.style.background = '#f59e0b';
    connText.textContent = 'Connecting...';

    // Create and initialize CouncilManager
    councilManager = new CouncilManager();

    councilManager.onMemberStatusChange = (specialist, status) => {
      updateMemberStatus(specialist, status);
    };

    councilManager.onChatMessage = (msg) => {
      addMessage(msg);
    };

    councilManager.onTranscript = (specialist, text, done) => {
      updateTranscript(specialist, text, done);
    };

    councilManager.onError = (specialist, error) => {
      const member = COUNCIL_MEMBERS[specialist];
      addMessage({
        type: 'system',
        text: `Error with Dr. ${member.name}: ${error}`
      });
    };

    councilManager.onReady = () => {
      connDot.style.background = '#22c55e';
      connText.textContent = 'Connected';
      addMessage({ type: 'system', text: 'All specialists connected. Council is in session.' });
    };

    try {
      await councilManager.initialize(specs, chair, caseContext);
    } catch (err) {
      connDot.style.background = '#ef4444';
      connText.textContent = 'Connection failed';
      addMessage({ type: 'system', text: `Failed to start council: ${err.message}` });
    }
  });

  // ── Render Member List ──

  function renderMemberList(specs, leader) {
    memberList.innerHTML = '';

    for (const key of specs) {
      const member = COUNCIL_MEMBERS[key];
      const item = document.createElement('div');
      item.className = 'member-item';
      item.id = `member-${key}`;
      item.innerHTML = `
        <div class="indicator connecting" id="indicator-${key}"></div>
        <div>
          <div class="member-name" style="color:${member.color}">Dr. ${member.name}</div>
          <div class="member-role">${member.title}</div>
        </div>
        ${key === leader ? '<span class="leader-badge">CHAIR</span>' : ''}
      `;
      memberList.appendChild(item);
    }
  }

  // ── Update Member Status ──

  function updateMemberStatus(specialist, status) {
    const indicator = document.getElementById(`indicator-${specialist}`);
    if (!indicator) return;

    // Remove all status classes
    indicator.className = 'indicator';
    indicator.classList.add(status);
  }

  // ── Chat Messages ──

  function addMessage(msg) {
    const el = document.createElement('div');

    switch (msg.type) {
      case 'system': {
        el.className = 'msg system';
        el.textContent = msg.text;
        break;
      }

      case 'specialist': {
        const member = COUNCIL_MEMBERS[msg.specialist];
        el.className = 'msg specialist';
        el.style.borderLeftColor = member.color;
        el.innerHTML = `
          <div class="msg-header">
            <span class="msg-sender" style="color:${member.color}">Dr. ${member.name}</span>
            <span class="msg-label">${msg.label || ''}</span>
          </div>
          <div class="msg-body">${msg.html}</div>
        `;
        break;
      }

      case 'user': {
        el.className = 'msg user';
        el.textContent = msg.text;
        break;
      }

      case 'hand_raised': {
        const member = COUNCIL_MEMBERS[msg.specialist];
        el.className = 'msg hand-raised';
        el.innerHTML = `&#x270B; <strong>Dr. ${member.name}</strong> requests the floor: "${escapeHtml(msg.topic)}"`;
        break;
      }

      case 'point_of_order': {
        const member = COUNCIL_MEMBERS[msg.specialist];
        el.className = 'msg point-of-order';
        el.innerHTML = `&#x26A0;&#xFE0F; <strong>POINT OF ORDER</strong> — Dr. ${member.name}: ${escapeHtml(msg.concern)}`;
        break;
      }

      default:
        return;
    }

    chatViewport.appendChild(el);
    scrollToBottom();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatViewport.scrollTop = chatViewport.scrollHeight;
    });
  }

  // ── Live Transcripts ──

  function updateTranscript(specialist, text, done) {
    const member = COUNCIL_MEMBERS[specialist];

    if (done) {
      // Remove live transcript element
      const existing = transcriptElements.get(specialist);
      if (existing && existing.parentNode) {
        existing.parentNode.removeChild(existing);
      }
      transcriptElements.delete(specialist);

      // Add as a finalized transcript message
      if (text.trim()) {
        const el = document.createElement('div');
        el.className = 'msg specialist';
        el.style.borderLeftColor = member.color;
        el.style.opacity = '0.7';
        el.innerHTML = `
          <div class="msg-header">
            <span class="msg-sender" style="color:${member.color}">Dr. ${member.name}</span>
            <span class="msg-label">spoke</span>
          </div>
          <div class="msg-body"><em>${escapeHtml(text)}</em></div>
        `;
        chatViewport.appendChild(el);
        scrollToBottom();
      }
      return;
    }

    // Live transcript — update or create
    let el = transcriptElements.get(specialist);
    if (!el) {
      el = document.createElement('div');
      el.className = 'msg transcript';
      chatViewport.appendChild(el);
      transcriptElements.set(specialist, el);
    }

    el.innerHTML = `<strong style="color:${member.color}">Dr. ${member.name}:</strong> ${escapeHtml(text)}<span class="dots"></span>`;
    scrollToBottom();
  }

  // ── Chat Input ──

  function sendUserMessage() {
    const text = chatInput.value.trim();
    if (!text || !councilManager) return;

    addMessage({ type: 'user', text });
    councilManager.sendTextToAll(text);
    chatInput.value = '';
  }

  btnSend.addEventListener('click', sendUserMessage);

  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendUserMessage();
    }
  });

  // ── File Upload ──

  btnUploadTrigger.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file || !councilManager) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      const mimeType = file.type || 'image/png';

      addMessage({ type: 'system', text: `Image uploaded: ${file.name}` });
      councilManager.sendImageToAll(base64, mimeType);
    };
    reader.readAsDataURL(file);

    // Reset input
    fileInput.value = '';
  });

  // ── Mic Toggle ──

  btnMic.addEventListener('click', () => {
    micMuted = !micMuted;
    if (councilManager) {
      councilManager.setMicMuted(micMuted);
    }
    btnMic.classList.toggle('muted', micMuted);
    btnMic.classList.toggle('active', !micMuted);
    btnMic.title = micMuted ? 'Unmute microphone' : 'Mute microphone';
  });

  // ── Speaker Toggle ──

  btnSpeaker.addEventListener('click', () => {
    speakerOn = !speakerOn;
    if (councilManager && councilManager.audioRouter) {
      councilManager.audioRouter.setSpeakerVolume(speakerOn ? 1 : 0);
    }
    btnSpeaker.classList.toggle('active', speakerOn);
    btnSpeaker.style.opacity = speakerOn ? '1' : '0.5';
    btnSpeaker.title = speakerOn ? 'Mute speakers' : 'Unmute speakers';
  });

  // ── End Session ──

  btnEnd.addEventListener('click', () => {
    if (!councilManager) return;

    if (!confirm('End the council session? All connections will be closed.')) return;

    addMessage({ type: 'system', text: 'Council session ended.' });
    councilManager.destroy();
    councilManager = null;

    connDot.style.background = '#6b7280';
    connText.textContent = 'Disconnected';

    // Update all member indicators
    document.querySelectorAll('.indicator').forEach(el => {
      el.className = 'indicator disconnected';
    });
  });

  // ── Initialize ──

  renderSetup();

})();
