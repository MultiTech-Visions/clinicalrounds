'use client';

import { useRef, useEffect } from 'react';
import { PixelAvatar } from './PixelAvatar';
import { drawCouncilRoom } from './draw-avatar';
import type { CouncilSpecialist, MemberConnectionStatus } from '@/lib/council/types';
import { getMemberInfo } from '@/lib/council/specialist-names';

interface CouncilMemberDisplay {
  specialist: CouncilSpecialist;
  status: MemberConnectionStatus;
}

interface CouncilTableProps {
  members: CouncilMemberDisplay[];
  leader: CouncilSpecialist;
  onMemberClick?: (specialist: CouncilSpecialist) => void;
}

const ROOM_W = 128;
const ROOM_H = 80;
const ROOM_SCALE = 3;

export function CouncilTable({
  members,
  leader,
  onMemberClick,
}: CouncilTableProps) {
  const roomCanvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    frameRef.current = 0;

    const draw = () => {
      const canvas = roomCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      drawCouncilRoom(ctx, ROOM_W, ROOM_H, members.length, frameRef.current);
      frameRef.current++;
    };

    draw();
    timerRef.current = setInterval(draw, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [members.length]);

  // Arrange members in a semicircle around the table
  const positions = getPositions(members.length);

  return (
    <div className="relative select-none">
      {/* Pixel art background room */}
      <canvas
        ref={roomCanvasRef}
        width={ROOM_W}
        height={ROOM_H}
        className="w-full rounded-lg"
        style={{
          imageRendering: 'pixelated',
          maxWidth: ROOM_W * ROOM_SCALE,
        }}
      />

      {/* Members positioned over the room */}
      <div
        className="absolute inset-0"
        style={{ maxWidth: ROOM_W * ROOM_SCALE }}
      >
        {members.map((m, i) => {
          const info = getMemberInfo(m.specialist);
          const pos = positions[i] || { x: 50, y: 50 };
          const isLeader = m.specialist === leader;

          return (
            <div
              key={m.specialist}
              className="absolute flex flex-col items-center transition-all duration-300"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button
                onClick={() => onMemberClick?.(m.specialist)}
                className="group relative"
                title={`${info.name} — ${info.title}`}
              >
                {/* Avatar */}
                <PixelAvatar
                  specialist={m.specialist}
                  status={m.status}
                  size={1}
                  className="transition-transform group-hover:scale-110"
                />

                {/* Name label */}
                <div
                  className="mt-0.5 rounded-sm px-1 text-center text-[8px] font-bold leading-tight"
                  style={{
                    backgroundColor: `${info.color}CC`,
                    color: '#FFFFFF',
                    textShadow: '0 1px 0 rgba(0,0,0,0.5)',
                  }}
                >
                  {info.name}
                  {isLeader && ' *'}
                </div>

                {/* Status indicator dot */}
                <div
                  className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-black/30 ${
                    m.status === 'speaking'
                      ? 'animate-pulse bg-green-400'
                      : m.status === 'hand_raised'
                        ? 'animate-bounce bg-yellow-400'
                        : m.status === 'connected'
                          ? 'bg-green-500'
                          : m.status === 'connecting'
                            ? 'animate-pulse bg-blue-400'
                            : m.status === 'error' || m.status === 'disconnected'
                              ? 'bg-red-500'
                              : 'bg-gray-400'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Calculate positions for N members in a semicircle arrangement
function getPositions(count: number): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  if (count === 1) return [{ x: 50, y: 25 }];

  const positions: Array<{ x: number; y: number }> = [];

  // Arrange in an arc from left to right
  // Top row: specialists sit behind the table
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = 10 + t * 80; // 10% to 90% horizontal
    // Slight curve - edges are lower, center is higher
    const curve = Math.sin(t * Math.PI) * 15;
    const y = 35 - curve; // base y around 35%, curve upward in center
    positions.push({ x, y });
  }

  return positions;
}
