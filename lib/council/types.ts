// Council Voice Chat - Type Definitions

export type CouncilSpecialist =
  | 'attending'
  | 'cardiologist'
  | 'pulmonologist'
  | 'nephrologist'
  | 'hepatologist'
  | 'hematologist'
  | 'id_specialist'
  | 'radiologist'
  | 'pharmacist'
  | 'endocrinologist'
  | 'neurologist'
  | 'intensivist'
  | 'oncologist'
  | 'psychiatrist'
  | 'toxicologist'
  | 'palliative';

export interface CouncilMemberInfo {
  specialist: CouncilSpecialist;
  name: string;
  title: string;
  voice: OpenAIVoice;
  color: string;
}

export type OpenAIVoice = 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';

export interface CouncilSession {
  id: string;
  members: CouncilMemberInfo[];
  leader: CouncilSpecialist;
  status: 'setup' | 'connecting' | 'active' | 'ended';
  startedAt: number | null;
}

export type MemberConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'speaking'
  | 'listening'
  | 'hand_raised'
  | 'disconnected'
  | 'error';

export interface MemberState {
  info: CouncilMemberInfo;
  status: MemberConnectionStatus;
  isMuted: boolean;
  pc: RTCPeerConnection | null;
  dc: RTCDataChannel | null;
  remoteStream: MediaStream | null;
}

export interface ChatMessage {
  id: string;
  from: string;          // member name or 'You'
  specialist?: CouncilSpecialist;
  type: 'text' | 'html' | 'image' | 'file' | 'system' | 'tool_result';
  content: string;
  timestamp: number;
}

export interface CouncilTool {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

// Events from the data channel
export interface RealtimeEvent {
  type: string;
  [key: string]: unknown;
}

export interface RealtimeResponseAudioDelta {
  type: 'response.audio.delta';
  delta: string; // base64 audio
}

export interface RealtimeFunctionCall {
  type: 'response.function_call_arguments.done';
  call_id: string;
  name: string;
  arguments: string;
}
