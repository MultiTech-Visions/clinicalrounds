'use client';

import { useRef, useEffect } from 'react';
import type { CouncilSpecialist, MemberConnectionStatus } from '@/lib/council/types';
import { drawAvatar, SPRITE_W, SPRITE_H } from './draw-avatar';

interface PixelAvatarProps {
  specialist: CouncilSpecialist;
  status: MemberConnectionStatus;
  size?: number; // display size multiplier (default 4 = 64x80px)
  className?: string;
}

export function PixelAvatar({
  specialist,
  status,
  size = 4,
  className = '',
}: PixelAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    frameRef.current = 0;

    // Draw immediately
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      drawAvatar(ctx, specialist, status, frameRef.current);
      frameRef.current++;
    };

    draw();

    // Animate at ~10fps for retro pixel feel
    timerRef.current = setInterval(draw, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [specialist, status]);

  return (
    <canvas
      ref={canvasRef}
      width={SPRITE_W}
      height={SPRITE_H}
      className={className}
      style={{
        width: SPRITE_W * size,
        height: SPRITE_H * size,
        imageRendering: 'pixelated',
      }}
    />
  );
}
