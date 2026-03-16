'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CouncilChat } from './CouncilChat';
import { CouncilManager } from '@/lib/council/council-manager';
import { getMemberInfo } from '@/lib/council/specialist-names';
import type {
  CouncilSpecialist,
  MemberConnectionStatus,
  ChatMessage,
} from '@/lib/council/types';

interface CouncilRoomProps {
  selectedSpecialists: CouncilSpecialist[];
  leader: CouncilSpecialist;
  caseContext: string;
  onEnd: () => void;
}

interface MemberDisplayState {
  specialist: CouncilSpecialist;
  status: MemberConnectionStatus;
}

export function CouncilRoom({
  selectedSpecialists,
  leader,
  caseContext,
  onEnd,
}: CouncilRoomProps) {
  const managerRef = useRef<CouncilManager | null>(null);
  const [members, setMembers] = useState<MemberDisplayState[]>(
    selectedSpecialists.map(s => ({ specialist: s, status: 'idle' as const }))
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [transcripts, setTranscripts] = useState<Map<string, string>>(new Map());
  const [micMuted, setMicMuted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize the council on mount
  useEffect(() => {
    const manager = new CouncilManager({
      onMemberStatusChange: (specialist, status) => {
        setMembers(prev =>
          prev.map(m =>
            m.specialist === specialist ? { ...m, status } : m
          )
        );
      },
      onChatMessage: (msg) => {
        setMessages(prev => [...prev, msg]);
      },
      onTranscript: (specialist, text, isFinal) => {
        if (isFinal) {
          // Move final transcript to chat messages
          const info = getMemberInfo(specialist);
          setMessages(prev => [
            ...prev,
            {
              id: `transcript-${specialist}-${Date.now()}`,
              from: info.name,
              specialist,
              type: 'text',
              content: text,
              timestamp: Date.now(),
            },
          ]);
          // Clear partial transcript
          setTranscripts(prev => {
            const next = new Map(prev);
            next.delete(specialist);
            return next;
          });
        } else {
          // Update partial transcript — deltas are appended to build up the current utterance
          setTranscripts(prev => {
            const next = new Map(prev);
            next.set(specialist, (prev.get(specialist) || '') + text);
            return next;
          });
        }
      },
      onError: (specialist, err) => {
        console.error(`Council error (${specialist}):`, err);
        if (specialist === 'system') {
          setError(err);
        }
      },
      onReady: () => {
        setIsConnecting(false);
      },
    });

    managerRef.current = manager;

    manager
      .initialize(selectedSpecialists, leader, caseContext)
      .catch(err => {
        setError(err.message || 'Failed to start council');
        setIsConnecting(false);
      });

    return () => {
      manager.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendText = useCallback((text: string) => {
    const manager = managerRef.current;
    if (!manager) return;

    // Add to chat as user message
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        from: 'You',
        type: 'text',
        content: text,
        timestamp: Date.now(),
      },
    ]);

    manager.sendTextToAll(text);
  }, []);

  const handleSendFile = useCallback((file: File) => {
    const manager = managerRef.current;
    if (!manager) return;

    // For images, convert to base64 and send
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          manager.sendImageToAll(base64, file.type);
          setMessages(prev => [
            ...prev,
            {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              from: 'You',
              type: 'image',
              content: reader.result as string,
              timestamp: Date.now(),
            },
          ]);
        } catch (err) {
          console.error('Failed to send image:', err);
        }
      };
      reader.onerror = () => console.error('Failed to read file:', file.name);
      reader.readAsDataURL(file);
    } else {
      // For text files, read and send as text
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = `[File: ${file.name}]\n${reader.result as string}`;
          manager.sendTextToAll(text);
          setMessages(prev => [
            ...prev,
            {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              from: 'You',
              type: 'file',
              content: `Shared file: ${file.name}`,
              timestamp: Date.now(),
            },
          ]);
        } catch (err) {
          console.error('Failed to send file:', err);
        }
      };
      reader.onerror = () => console.error('Failed to read file:', file.name);
      reader.readAsText(file);
    }
  }, []);

  const toggleMic = useCallback(() => {
    const manager = managerRef.current;
    if (!manager) return;
    const next = !micMuted;
    setMicMuted(next);
    manager.setMicMuted(next);
  }, [micMuted]);

  const handleEnd = useCallback(() => {
    managerRef.current?.destroy();
    onEnd();
  }, [onEnd]);

  if (error) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="text-xl font-bold">Connection Failed</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onEnd}>
          Back to Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">
            Voice Council{' '}
            {isConnecting && (
              <span className="text-sm font-normal text-muted-foreground">
                Connecting...
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={micMuted ? 'destructive' : 'outline'}
            size="sm"
            onClick={toggleMic}
          >
            {micMuted ? (
              <>
                <MicOffIcon /> Unmute
              </>
            ) : (
              <>
                <MicIcon /> Mute
              </>
            )}
          </Button>
          <Button variant="destructive" size="sm" onClick={handleEnd}>
            End Session
          </Button>
        </div>
      </div>

      {/* Main content: members grid + chat */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Members panel */}
        <div className="w-64 shrink-0 space-y-2 overflow-y-auto">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Members
          </h3>
          {members.map(m => {
            const info = getMemberInfo(m.specialist);
            return (
              <MemberTile
                key={m.specialist}
                name={info.name}
                title={info.title}
                color={info.color}
                status={m.status}
                isLeader={m.specialist === leader}
              />
            );
          })}
        </div>

        {/* Chat viewport */}
        <div className="flex-1">
          <CouncilChat
            messages={messages}
            transcripts={transcripts}
            onSendText={handleSendText}
            onSendFile={handleSendFile}
          />
        </div>
      </div>
    </div>
  );
}

function MemberTile({
  name,
  title,
  color,
  status,
  isLeader,
}: {
  name: string;
  title: string;
  color: string;
  status: MemberConnectionStatus;
  isLeader: boolean;
}) {
  const statusConfig: Record<MemberConnectionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    idle: { label: 'Idle', variant: 'secondary' },
    connecting: { label: 'Connecting...', variant: 'outline' },
    connected: { label: 'Connected', variant: 'default' },
    speaking: { label: 'Speaking', variant: 'default' },
    listening: { label: 'Listening', variant: 'secondary' },
    hand_raised: { label: 'Hand Raised', variant: 'outline' },
    disconnected: { label: 'Disconnected', variant: 'destructive' },
    error: { label: 'Error', variant: 'destructive' },
  };

  const { label, variant } = statusConfig[status];

  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border p-3 transition-all"
      style={{
        borderLeftColor: color,
        borderLeftWidth: '3px',
        backgroundColor:
          status === 'speaking'
            ? `${color}10`
            : undefined,
      }}
    >
      {/* Animated indicator */}
      <div className="relative">
        <div
          className="h-8 w-8 rounded-full"
          style={{ backgroundColor: `${color}30` }}
        />
        {status === 'speaking' && (
          <div
            className="absolute inset-0 animate-ping rounded-full opacity-40"
            style={{ backgroundColor: color }}
          />
        )}
        {status === 'hand_raised' && (
          <span className="absolute -right-1 -top-1 text-sm">
            &#9995;
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium truncate">{name}</span>
          {isLeader && (
            <span className="text-[10px] font-bold text-muted-foreground">
              CHAIR
            </span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">{title}</div>
        <Badge variant={variant} className="mt-1 text-[10px]">
          {label}
        </Badge>
      </div>
    </div>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2" />
      <path d="M5 10v2a7 7 0 0 0 12 5" />
      <path d="M15 9.34V5a3 3 0 0 0-5.68-1.33" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}
