// Council Manager — Orchestrates all WebRTC sessions and the audio router

import type {
  CouncilSpecialist,
  CouncilMemberInfo,
  ChatMessage,
  MemberConnectionStatus,
} from './types';
import { getMemberInfo } from './specialist-names';
import { AudioRouter } from './audio-router';
import { RealtimeSession, type SessionCallbacks } from './realtime-session';

export interface CouncilCallbacks {
  onMemberStatusChange: (specialist: CouncilSpecialist, status: MemberConnectionStatus) => void;
  onChatMessage: (message: ChatMessage) => void;
  onTranscript: (specialist: CouncilSpecialist, text: string, isFinal: boolean) => void;
  onError: (specialist: CouncilSpecialist | 'system', error: string) => void;
  onReady: () => void;
}

export class CouncilManager {
  private audioRouter: AudioRouter;
  private sessions: Map<CouncilSpecialist, RealtimeSession> = new Map();
  private members: CouncilMemberInfo[] = [];
  private leader: CouncilSpecialist = 'attending';
  private callbacks: CouncilCallbacks;
  private caseContext: string = '';
  private _isActive: boolean = false;

  constructor(callbacks: CouncilCallbacks) {
    this.audioRouter = new AudioRouter();
    this.callbacks = callbacks;
  }

  get isActive(): boolean { return this._isActive; }

  // Initialize the council with selected specialists
  async initialize(
    selectedSpecialists: CouncilSpecialist[],
    leader: CouncilSpecialist,
    caseContext: string = ''
  ): Promise<void> {
    this.leader = leader;
    this.caseContext = caseContext;
    this.members = selectedSpecialists.map(getMemberInfo);

    try {
      // Initialize the audio router (gets mic permission)
      await this.audioRouter.initialize();

      // Connect all members in parallel
      const connectPromises = selectedSpecialists.map(specialist =>
        this.connectMember(specialist)
      );

      // Use allSettled so one failure doesn't break the whole council
      const results = await Promise.allSettled(connectPromises);

      // Report any failures
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          const spec = selectedSpecialists[i];
          const reason = result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
          this.callbacks.onError(
            spec,
            `Failed to connect ${getMemberInfo(spec).name}: ${reason}`
          );
        }
      });

      // Check we got at least 2 connected (leader + one specialist)
      const connected = results.filter(r => r.status === 'fulfilled').length;
      if (connected < 2) {
        throw new Error('Could not connect enough council members');
      }

      this._isActive = true;
      this.callbacks.onReady();

      // Notify all members about who's in the room
      this.broadcastSystemEvent(
        `Council session started. ${connected} members connected. ` +
        `${getMemberInfo(leader).name} is chairing.`
      );

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Initialization failed';
      this.callbacks.onError('system', message);
      this.destroy();
      throw error;
    }
  }

  private async connectMember(specialist: CouncilSpecialist): Promise<void> {
    const memberInfo = getMemberInfo(specialist);
    const isLeader = specialist === this.leader;

    const sessionCallbacks: SessionCallbacks = {
      onStatusChange: (spec, status) => {
        this.callbacks.onMemberStatusChange(spec as CouncilSpecialist, status);
      },
      onChatMessage: (msg) => {
        this.callbacks.onChatMessage(msg);
      },
      onTranscript: (spec, text, isFinal) => {
        this.callbacks.onTranscript(spec as CouncilSpecialist, text, isFinal);
      },
      onError: (spec, err) => {
        this.callbacks.onError(spec as CouncilSpecialist, err);
      },
    };

    const session = new RealtimeSession(
      memberInfo,
      this.members,
      isLeader,
      this.audioRouter,
      sessionCallbacks,
      this.caseContext
    );

    await session.connect();
    this.sessions.set(specialist, session);
  }

  // Send a text message to all council members (from the human)
  sendTextToAll(text: string): void {
    for (const session of this.sessions.values()) {
      session.sendText(text);
    }
  }

  // Send a text message to a specific member
  sendTextTo(specialist: CouncilSpecialist, text: string): void {
    const session = this.sessions.get(specialist);
    if (session) {
      session.sendText(text);
    }
  }

  // Send an image to all council members
  sendImageToAll(base64Image: string, mimeType?: string): void {
    for (const session of this.sessions.values()) {
      session.sendImage(base64Image, mimeType);
    }
  }

  // Send a system event to all members
  broadcastSystemEvent(text: string): void {
    for (const session of this.sessions.values()) {
      session.sendSystemEvent(text);
    }
  }

  // Mute/unmute the human's microphone
  setMicMuted(muted: boolean): void {
    this.audioRouter.setMicMuted(muted);
  }

  // Mute a specific council member
  setMemberMuted(specialist: CouncilSpecialist, muted: boolean): void {
    this.audioRouter.setSessionVolume(specialist, muted ? 0 : 1);
  }

  // Set master volume
  setMasterVolume(volume: number): void {
    this.audioRouter.setSpeakerVolume(volume);
  }

  // Disconnect a specific member
  disconnectMember(specialist: CouncilSpecialist): void {
    const session = this.sessions.get(specialist);
    if (session) {
      session.disconnect();
      this.sessions.delete(specialist);
      this.broadcastSystemEvent(
        `${getMemberInfo(specialist).name} has left the council.`
      );
    }
  }

  // Tear down the entire council
  destroy(): void {
    for (const session of this.sessions.values()) {
      try {
        session.disconnect();
      } catch {
        // Best-effort cleanup
      }
    }
    this.sessions.clear();
    try {
      this.audioRouter.destroy();
    } catch {
      // Best-effort cleanup
    }
    this._isActive = false;
  }
}
