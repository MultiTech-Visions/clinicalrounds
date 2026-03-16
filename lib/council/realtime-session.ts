// Individual WebRTC Realtime API session for one council member

import type { CouncilMemberInfo, ChatMessage, MemberConnectionStatus } from './types';
import { COUNCIL_TOOLS, buildSystemPrompt } from './parliamentary-prompts';
import type { AudioRouter } from './audio-router';

export interface SessionCallbacks {
  onStatusChange: (specialist: string, status: MemberConnectionStatus) => void;
  onChatMessage: (message: ChatMessage) => void;
  onTranscript: (specialist: string, text: string, isFinal: boolean) => void;
  onError: (specialist: string, error: string) => void;
}

export class RealtimeSession {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private member: CouncilMemberInfo;
  private allMembers: CouncilMemberInfo[];
  private isLeader: boolean;
  private audioRouter: AudioRouter;
  private callbacks: SessionCallbacks;
  private caseContext: string;
  private _status: MemberConnectionStatus = 'idle';
  private remoteStream: MediaStream | null = null;

  constructor(
    member: CouncilMemberInfo,
    allMembers: CouncilMemberInfo[],
    isLeader: boolean,
    audioRouter: AudioRouter,
    callbacks: SessionCallbacks,
    caseContext: string = ''
  ) {
    this.member = member;
    this.allMembers = allMembers;
    this.isLeader = isLeader;
    this.audioRouter = audioRouter;
    this.callbacks = callbacks;
    this.caseContext = caseContext;
  }

  get status(): MemberConnectionStatus { return this._status; }
  get info(): CouncilMemberInfo { return this.member; }
  get dataChannel(): RTCDataChannel | null { return this.dc; }

  private setStatus(status: MemberConnectionStatus) {
    this._status = status;
    this.callbacks.onStatusChange(this.member.specialist, status);
  }

  async connect(): Promise<void> {
    this.setStatus('connecting');

    try {
      // 1. Get ephemeral token from our server
      const systemPrompt = buildSystemPrompt(
        this.member,
        this.allMembers,
        this.isLeader,
        this.caseContext
      );

      const tokenRes = await fetch('/api/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview',
          voice: this.member.voice,
          instructions: systemPrompt,
          tools: COUNCIL_TOOLS,
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token request failed: ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.client_secret?.value;
      if (!ephemeralKey) {
        throw new Error('No ephemeral key in response');
      }

      // 2. Create RTCPeerConnection
      this.pc = new RTCPeerConnection();

      // 3. Get the mixed audio input for this session from the audio router
      const inputStream = this.audioRouter.createSessionInput(this.member.specialist);
      const audioTrack = inputStream.getAudioTracks()[0];
      if (audioTrack) {
        this.pc.addTrack(audioTrack, inputStream);
      }

      // 4. Handle remote audio (the specialist's voice)
      this.pc.ontrack = (event) => {
        this.remoteStream = event.streams[0] || new MediaStream([event.track]);
        // Register this specialist's audio output with the router
        this.audioRouter.addRemoteAudio(this.member.specialist, this.remoteStream);
      };

      // 5. Create data channel for events
      this.dc = this.pc.createDataChannel('oai-events');
      this.dc.onopen = () => {
        this.setStatus('connected');
      };
      this.dc.onmessage = (event) => {
        this.handleDataChannelMessage(event.data);
      };

      // 6. Create SDP offer and connect to OpenAI
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const sdpRes = await fetch(
        `https://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview`,
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
        throw new Error(`SDP exchange failed: ${sdpRes.status}`);
      }

      const answerSdp = await sdpRes.text();
      await this.pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });

      // Monitor connection state
      this.pc.onconnectionstatechange = () => {
        const state = this.pc?.connectionState;
        if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          this.setStatus('disconnected');
        }
      };

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      this.callbacks.onError(this.member.specialist, message);
      this.setStatus('error');
      throw error;
    }
  }

  // Send a text message to this specialist via the data channel
  sendText(text: string): void {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    };
    this.dc.send(JSON.stringify(event));

    // Trigger a response
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  // Send an image to this specialist
  sendImage(base64Image: string, mimeType: string = 'image/png'): void {
    if (!this.dc || this.dc.readyState !== 'open') return;

    // Note: images go as a user message with image content
    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_image',
            image: base64Image,
            mime_type: mimeType,
          },
        ],
      },
    };
    this.dc.send(JSON.stringify(event));
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  // Inject a system-level notification (e.g., "Dr. Smith has joined")
  sendSystemEvent(text: string): void {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text: `[SYSTEM]: ${text}` }],
      },
    };
    this.dc.send(JSON.stringify(event));
  }

  private handleDataChannelMessage(raw: string): void {
    try {
      const event = JSON.parse(raw);
      this.handleEvent(event);
    } catch {
      // Non-JSON message, ignore
    }
  }

  private handleEvent(event: Record<string, unknown>): void {
    switch (event.type) {
      case 'response.audio_transcript.delta': {
        // Partial transcript of specialist speaking
        const delta = event.delta as string;
        if (delta) {
          this.callbacks.onTranscript(this.member.specialist, delta, false);
        }
        break;
      }

      case 'response.audio_transcript.done': {
        // Final transcript of what the specialist said
        const transcript = event.transcript as string;
        if (transcript) {
          this.callbacks.onTranscript(this.member.specialist, transcript, true);
        }
        break;
      }

      case 'input_audio_buffer.speech_started': {
        this.setStatus('listening');
        break;
      }

      case 'input_audio_buffer.speech_stopped': {
        if (this._status === 'listening') {
          this.setStatus('connected');
        }
        break;
      }

      case 'response.created': {
        this.setStatus('speaking');
        break;
      }

      case 'response.done': {
        this.setStatus('connected');
        break;
      }

      case 'response.function_call_arguments.done': {
        this.handleToolCall(
          event.call_id as string,
          event.name as string,
          event.arguments as string
        );
        break;
      }

      case 'error': {
        const errMsg = (event.error as Record<string, string>)?.message || 'Unknown error';
        this.callbacks.onError(this.member.specialist, errMsg);
        break;
      }
    }
  }

  private handleToolCall(callId: string, name: string, argsStr: string): void {
    let args: Record<string, string>;
    try {
      args = JSON.parse(argsStr);
    } catch {
      args = {};
    }

    switch (name) {
      case 'post_to_chat': {
        const msg: ChatMessage = {
          id: `${this.member.specialist}-${Date.now()}`,
          from: this.member.name,
          specialist: this.member.specialist,
          type: 'html',
          content: args.html || '',
          timestamp: Date.now(),
        };
        this.callbacks.onChatMessage(msg);
        this.sendToolResult(callId, 'Content posted to the shared chat viewport. All members can see it.');
        break;
      }

      case 'request_floor': {
        this.setStatus('hand_raised');
        const msg: ChatMessage = {
          id: `${this.member.specialist}-floor-${Date.now()}`,
          from: this.member.name,
          specialist: this.member.specialist,
          type: 'system',
          content: `${this.member.name} raises hand to discuss: ${args.topic || 'a point'}`,
          timestamp: Date.now(),
        };
        this.callbacks.onChatMessage(msg);
        this.sendToolResult(callId, 'Your hand is raised. The Chair will recognize you shortly.');
        break;
      }

      case 'point_of_order': {
        const msg: ChatMessage = {
          id: `${this.member.specialist}-poo-${Date.now()}`,
          from: this.member.name,
          specialist: this.member.specialist,
          type: 'system',
          content: `POINT OF ORDER from ${this.member.name}: ${args.concern || ''}`,
          timestamp: Date.now(),
        };
        this.callbacks.onChatMessage(msg);
        this.sendToolResult(callId, 'Point of order raised. The Chair will address this immediately.');
        break;
      }

      default: {
        this.sendToolResult(callId, `Unknown tool: ${name}`);
      }
    }
  }

  private sendToolResult(callId: string, result: string): void {
    if (!this.dc || this.dc.readyState !== 'open') return;

    const event = {
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: result,
      },
    };
    this.dc.send(JSON.stringify(event));
    // Trigger response after tool result
    this.dc.send(JSON.stringify({ type: 'response.create' }));
  }

  disconnect(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.audioRouter.removeSession(this.member.specialist);
    this.remoteStream = null;
    this.setStatus('disconnected');
  }
}
