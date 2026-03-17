'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CouncilChat } from './CouncilChat';
import { CouncilTable } from './pixels/CouncilTable';
import { PixelAvatar } from './pixels/PixelAvatar';
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
  const [showMemberPanel, setShowMemberPanel] = useState(true);

  // Connection summary
  const connectionSummary = useMemo(() => {
    const connected = members.filter(m =>
      m.status === 'connected' || m.status === 'speaking' || m.status === 'listening' || m.status === 'hand_raised'
    ).length;
    const errors = members.filter(m => m.status === 'error' || m.status === 'disconnected').length;
    const speaking = members.filter(m => m.status === 'speaking').length;
    return { connected, errors, speaking, total: members.length };
  }, [members]);

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
          setTranscripts(prev => {
            const next = new Map(prev);
            next.delete(specialist);
            return next;
          });
        } else {
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

  // Error state
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
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={onEnd}>
          Back to Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold">Voice Council</h2>

          {/* Connection status pills */}
          {isConnecting ? (
            <Badge variant="outline" className="animate-pulse gap-1 text-xs">
              <span className="inline-block h-1.5 w-1.5 animate-spin rounded-full border border-current border-t-transparent" />
              Connecting {connectionSummary.connected}/{connectionSummary.total}
            </Badge>
          ) : (
            <div className="flex items-center gap-1.5">
              <Badge variant="secondary" className="gap-1 text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {connectionSummary.connected} online
              </Badge>
              {connectionSummary.speaking > 0 && (
                <Badge variant="default" className="gap-1 text-xs">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-300" />
                  {connectionSummary.speaking} speaking
                </Badge>
              )}
              {connectionSummary.errors > 0 && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  {connectionSummary.errors} failed
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle member panel (useful on smaller screens) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMemberPanel(p => !p)}
            className="lg:hidden"
            title={showMemberPanel ? 'Hide members' : 'Show members'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </Button>

          <Button
            variant={micMuted ? 'destructive' : 'outline'}
            size="sm"
            onClick={toggleMic}
            className="gap-1.5"
          >
            {micMuted ? <MicOffIcon /> : <MicIcon />}
            <span className="hidden sm:inline">{micMuted ? 'Unmute' : 'Mute'}</span>
          </Button>

          <Button variant="destructive" size="sm" onClick={handleEnd} className="gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
            <span className="hidden sm:inline">End Session</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: pixel council scene + member list */}
        <div
          className={`${
            showMemberPanel ? 'flex' : 'hidden lg:flex'
          } w-72 shrink-0 flex-col border-r border-border lg:w-80`}
        >
          {/* Pixel art council scene */}
          <div className="border-b border-border p-3">
            <CouncilTable members={members} leader={leader} />
          </div>

          {/* Member list */}
          <div className="flex items-center justify-between px-3 pt-3 pb-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Members</span>
            <span className="text-xs tabular-nums text-muted-foreground">{members.length}</span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
            {members.map(m => {
              const info = getMemberInfo(m.specialist);
              return (
                <MemberTile
                  key={m.specialist}
                  specialist={m.specialist}
                  name={info.name}
                  title={info.title}
                  color={info.color}
                  status={m.status}
                  isLeader={m.specialist === leader}
                />
              );
            })}
          </div>
        </div>

        {/* Chat viewport */}
        <div className="flex-1 min-w-0">
          <CouncilChat
            messages={messages}
            transcripts={transcripts}
            onSendText={handleSendText}
            onSendFile={handleSendFile}
            memberCount={members.length}
          />
        </div>
      </div>
    </div>
  );
}

function MemberTile({
  specialist,
  name,
  title,
  color,
  status,
  isLeader,
}: {
  specialist: CouncilSpecialist;
  name: string;
  title: string;
  color: string;
  status: MemberConnectionStatus;
  isLeader: boolean;
}) {
  const statusConfig: Record<MemberConnectionStatus, { label: string; dot: string }> = {
    idle: { label: 'Idle', dot: 'bg-gray-400' },
    connecting: { label: 'Connecting', dot: 'bg-blue-400 animate-pulse' },
    connected: { label: 'Ready', dot: 'bg-green-500' },
    speaking: { label: 'Speaking', dot: 'bg-green-400 animate-pulse' },
    listening: { label: 'Listening', dot: 'bg-emerald-500' },
    hand_raised: { label: 'Hand Raised', dot: 'bg-yellow-400 animate-bounce' },
    disconnected: { label: 'Offline', dot: 'bg-red-500' },
    error: { label: 'Error', dot: 'bg-red-500' },
  };

  const { label, dot } = statusConfig[status];

  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg p-2 transition-all duration-200 ${
        status === 'speaking'
          ? 'bg-primary/5 ring-1 ring-primary/20'
          : status === 'hand_raised'
            ? 'bg-yellow-500/5 ring-1 ring-yellow-500/20'
            : 'hover:bg-muted/50'
      }`}
      style={{ borderLeft: `3px solid ${color}` }}
    >
      {/* Pixel avatar */}
      <div className="relative shrink-0">
        <PixelAvatar specialist={specialist} status={status} size={1.5} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-semibold">{name}</span>
          {isLeader && (
            <span className="shrink-0 rounded bg-muted px-1 py-px text-[9px] font-bold text-muted-foreground">
              CHAIR
            </span>
          )}
        </div>
        <div className="truncate text-[10px] text-muted-foreground">{title}</div>
      </div>

      {/* Status dot + label */}
      <div className="flex shrink-0 items-center gap-1">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="hidden text-[10px] text-muted-foreground xl:inline">{label}</span>
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
