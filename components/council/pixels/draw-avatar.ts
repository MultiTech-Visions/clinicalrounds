// Procedural pixel art avatar renderer
// Draws 16x20 pixel characters on a canvas, scaled up with CSS image-rendering: pixelated

import type { CouncilSpecialist, MemberConnectionStatus } from '@/lib/council/types';

export const SPRITE_W = 16;
export const SPRITE_H = 20;

// --- Skin tone palette (diverse) ---
const SKIN = {
  light:      '#FFDBB4',
  medLight:   '#E8B88A',
  medium:     '#C68642',
  medDark:    '#8D5524',
  dark:       '#613318',
};

// --- Hair styles ---
// Each is a function that draws hair pixels at the given coords
type HairDrawFn = (ctx: CanvasRenderingContext2D, color: string) => void;

const HAIR_STYLES: Record<number, HairDrawFn> = {
  // 0: Short crop - flat top
  0: (ctx, c) => {
    ctx.fillStyle = c;
    fillRow(ctx, 5, 10, 1);
    fillRow(ctx, 4, 11, 2);
    ctx.fillRect(4, 3, 1, 1); ctx.fillRect(11, 3, 1, 1);
  },
  // 1: Spiky
  1: (ctx, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(5, 0, 1, 1); ctx.fillRect(7, 0, 1, 1);
    ctx.fillRect(9, 0, 1, 1); ctx.fillRect(10, 0, 1, 1);
    fillRow(ctx, 5, 10, 1);
    fillRow(ctx, 4, 11, 2);
    ctx.fillRect(4, 3, 1, 2); ctx.fillRect(11, 3, 1, 2);
  },
  // 2: Side part
  2: (ctx, c) => {
    ctx.fillStyle = c;
    fillRow(ctx, 4, 10, 1);
    fillRow(ctx, 3, 11, 2);
    ctx.fillRect(3, 3, 2, 2); ctx.fillRect(11, 3, 1, 1);
  },
  // 3: Pompadour (tall front)
  3: (ctx, c) => {
    ctx.fillStyle = c;
    fillRow(ctx, 5, 9, 0);
    fillRow(ctx, 4, 10, 1);
    fillRow(ctx, 4, 11, 2);
    ctx.fillRect(4, 3, 1, 1); ctx.fillRect(11, 3, 1, 1);
  },
  // 4: Long / flowing
  4: (ctx, c) => {
    ctx.fillStyle = c;
    fillRow(ctx, 5, 10, 1);
    fillRow(ctx, 4, 11, 2);
    ctx.fillRect(3, 3, 2, 5); ctx.fillRect(11, 3, 2, 5);
  },
  // 5: Bun / updo
  5: (ctx, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(6, 0, 3, 1);
    fillRow(ctx, 5, 10, 1);
    fillRow(ctx, 4, 11, 2);
    ctx.fillRect(4, 3, 1, 1); ctx.fillRect(11, 3, 1, 1);
  },
  // 6: Buzz cut
  6: (ctx, c) => {
    ctx.fillStyle = c;
    fillRow(ctx, 5, 10, 2);
    ctx.fillRect(5, 3, 1, 1); ctx.fillRect(10, 3, 1, 1);
  },
  // 7: Curly / wide
  7: (ctx, c) => {
    ctx.fillStyle = c;
    fillRow(ctx, 4, 11, 0);
    fillRow(ctx, 3, 12, 1);
    fillRow(ctx, 3, 12, 2);
    ctx.fillRect(3, 3, 2, 3); ctx.fillRect(11, 3, 2, 3);
  },
};

// --- Per-specialist visual config ---
interface SpecialistVisual {
  hairStyle: number;
  hairColor: string;
  skinTone: string;
  accentColor: string;
  accessory: 'stethoscope' | 'heart' | 'lungs' | 'drop' | 'leaf' | 'cross' |
    'magnifier' | 'film' | 'pill' | 'scale' | 'brain' | 'monitor' |
    'target' | 'book' | 'flask' | 'dove';
}

const VISUALS: Record<CouncilSpecialist, SpecialistVisual> = {
  attending:      { hairStyle: 3, hairColor: '#9CA3AF', skinTone: SKIN.light,    accentColor: '#8B5CF6', accessory: 'stethoscope' },
  cardiologist:   { hairStyle: 2, hairColor: '#1C1917', skinTone: SKIN.medium,   accentColor: '#EF4444', accessory: 'heart' },
  pulmonologist:  { hairStyle: 4, hairColor: '#92400E', skinTone: SKIN.light,    accentColor: '#06B6D4', accessory: 'lungs' },
  nephrologist:   { hairStyle: 6, hairColor: '#0C0A09', skinTone: SKIN.medDark,  accentColor: '#3B82F6', accessory: 'drop' },
  hepatologist:   { hairStyle: 5, hairColor: '#B91C1C', skinTone: SKIN.medLight, accentColor: '#84CC16', accessory: 'leaf' },
  hematologist:   { hairStyle: 7, hairColor: '#44403C', skinTone: SKIN.dark,     accentColor: '#DC2626', accessory: 'cross' },
  id_specialist:  { hairStyle: 0, hairColor: '#78350F', skinTone: SKIN.medLight, accentColor: '#F59E0B', accessory: 'magnifier' },
  radiologist:    { hairStyle: 1, hairColor: '#0C0A09', skinTone: SKIN.light,    accentColor: '#6366F1', accessory: 'film' },
  pharmacist:     { hairStyle: 2, hairColor: '#CA8A04', skinTone: SKIN.medium,   accentColor: '#10B981', accessory: 'pill' },
  endocrinologist:{ hairStyle: 4, hairColor: '#0C0A09', skinTone: SKIN.medDark,  accentColor: '#EC4899', accessory: 'scale' },
  neurologist:    { hairStyle: 7, hairColor: '#6B21A8', skinTone: SKIN.medLight, accentColor: '#A855F7', accessory: 'brain' },
  intensivist:    { hairStyle: 6, hairColor: '#292524', skinTone: SKIN.dark,     accentColor: '#F97316', accessory: 'monitor' },
  oncologist:     { hairStyle: 0, hairColor: '#9A3412', skinTone: SKIN.light,    accentColor: '#14B8A6', accessory: 'target' },
  psychiatrist:   { hairStyle: 5, hairColor: '#D1D5DB', skinTone: SKIN.medium,   accentColor: '#8B5CF6', accessory: 'book' },
  toxicologist:   { hairStyle: 1, hairColor: '#4D7C0F', skinTone: SKIN.medLight, accentColor: '#FBBF24', accessory: 'flask' },
  palliative:     { hairStyle: 4, hairColor: '#78350F', skinTone: SKIN.medDark,  accentColor: '#F9A8D4', accessory: 'dove' },
};

// --- Helper: fill a horizontal run ---
function fillRow(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.fillRect(x1, y, x2 - x1 + 1, 1);
}

// --- Helper: darker shade ---
function darken(hex: string, amount: number = 0.2): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 - amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 - amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 - amount));
  return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
}

// ===== MAIN DRAW FUNCTION =====
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  specialist: CouncilSpecialist,
  status: MemberConnectionStatus,
  frame: number
): void {
  const v = VISUALS[specialist];
  ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);

  // Compute animation offsets
  const breatheY = status === 'idle' || status === 'connected' ? Math.sin(frame * 0.1) * 0.5 : 0;
  const isHandUp = status === 'hand_raised';
  const isSpeaking = status === 'speaking';
  const isPOO = status === 'listening' && frame % 10 < 5; // flash for point_of_order visual

  ctx.save();
  ctx.translate(0, breatheY);

  // --- SHOES ---
  ctx.fillStyle = '#1C1917';
  ctx.fillRect(4, 18, 3, 2);
  ctx.fillRect(9, 18, 3, 2);

  // --- LEGS ---
  ctx.fillStyle = '#374151';
  ctx.fillRect(5, 16, 2, 2);
  ctx.fillRect(9, 16, 2, 2);

  // --- PANTS ---
  ctx.fillStyle = '#374151';
  fillRow(ctx, 5, 10, 14);
  fillRow(ctx, 5, 10, 15);

  // --- COAT ---
  ctx.fillStyle = '#F8FAFC'; // white coat
  fillRow(ctx, 5, 10, 9);
  fillRow(ctx, 4, 11, 10);
  fillRow(ctx, 4, 11, 11);
  fillRow(ctx, 4, 11, 12);
  fillRow(ctx, 5, 10, 13);

  // Coat shadow
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(5, 13, 6, 1);

  // --- ACCENT BADGE ---
  ctx.fillStyle = v.accentColor;
  ctx.fillRect(6, 10, 2, 2);

  // --- ARMS ---
  ctx.fillStyle = '#F8FAFC';
  if (isHandUp) {
    // Left arm normal
    ctx.fillRect(2, 10, 2, 4);
    ctx.fillStyle = v.skinTone;
    ctx.fillRect(2, 14, 2, 1);
    // Right arm raised
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(12, 5, 2, 5);
    ctx.fillStyle = v.skinTone;
    ctx.fillRect(12, 3, 2, 2); // hand up high
  } else {
    // Both arms down
    ctx.fillRect(2, 10, 2, 4);
    ctx.fillRect(12, 10, 2, 4);
    // Hands
    ctx.fillStyle = v.skinTone;
    ctx.fillRect(2, 14, 2, 1);
    ctx.fillRect(12, 14, 2, 1);
  }

  // --- NECK ---
  ctx.fillStyle = v.skinTone;
  ctx.fillRect(7, 8, 2, 2);

  // --- HEAD ---
  ctx.fillStyle = v.skinTone;
  fillRow(ctx, 5, 10, 3);
  fillRow(ctx, 5, 10, 4);
  fillRow(ctx, 5, 10, 5);
  fillRow(ctx, 5, 10, 6);
  fillRow(ctx, 5, 10, 7);
  fillRow(ctx, 6, 9, 8);

  // --- EYES ---
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(6, 5, 1, 1);
  ctx.fillRect(9, 5, 1, 1);
  // Eye whites
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(6, 4, 2, 1);
  ctx.fillRect(9, 4, 2, 1);
  // Pupils
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(7, 5, 1, 1);
  ctx.fillRect(10, 5, 1, 1);

  // --- MOUTH ---
  if (isSpeaking && frame % 8 < 4) {
    // Open mouth
    ctx.fillStyle = '#7F1D1D';
    ctx.fillRect(7, 7, 2, 1);
  } else {
    // Closed mouth / smile
    ctx.fillStyle = darken(v.skinTone, 0.3);
    ctx.fillRect(7, 7, 2, 1);
  }

  // --- HAIR ---
  const drawHair = HAIR_STYLES[v.hairStyle] || HAIR_STYLES[0];
  drawHair(ctx, v.hairColor);

  // --- ACCESSORY (small icon on coat badge area) ---
  drawAccessory(ctx, v.accessory, v.accentColor);

  ctx.restore();

  // --- STATUS OVERLAYS (drawn without breathe offset) ---

  // Hand raised sparkle
  if (isHandUp) {
    const sparkleOn = frame % 6 < 3;
    if (sparkleOn) {
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(14, 1, 1, 1);
      ctx.fillRect(13, 2, 1, 1);
      ctx.fillRect(15, 2, 1, 1);
      ctx.fillRect(14, 3, 1, 1);
    }
  }

  // Speaking indicator - sound waves
  if (isSpeaking) {
    const waveFrame = frame % 12;
    ctx.fillStyle = v.accentColor;
    if (waveFrame < 4) {
      ctx.fillRect(0, 6, 1, 1);
    } else if (waveFrame < 8) {
      ctx.fillRect(0, 5, 1, 1);
      ctx.fillRect(0, 7, 1, 1);
    } else {
      ctx.fillRect(0, 4, 1, 1);
      ctx.fillRect(0, 6, 1, 1);
      ctx.fillRect(0, 8, 1, 1);
    }
  }

  // Point of order / listening flash
  if (isPOO) {
    ctx.fillStyle = '#EF4444';
    // "!" above head
    ctx.fillRect(7, 0, 2, 1);
  }

  // Connecting spinner
  if (status === 'connecting') {
    const dotIdx = frame % 12;
    ctx.fillStyle = v.accentColor;
    if (dotIdx < 4) ctx.fillRect(6, 0, 1, 1);
    else if (dotIdx < 8) ctx.fillRect(8, 0, 1, 1);
    else ctx.fillRect(10, 0, 1, 1);
  }

  // Disconnected / error X
  if (status === 'disconnected' || status === 'error') {
    ctx.fillStyle = '#EF444488';
    ctx.fillRect(0, 0, SPRITE_W, SPRITE_H); // red tint overlay
    ctx.fillStyle = '#EF4444';
    // X marks
    ctx.fillRect(1, 1, 1, 1); ctx.fillRect(2, 2, 1, 1);
    ctx.fillRect(3, 1, 1, 1); ctx.fillRect(2, 0, 1, 1);
  }
}

// --- Accessory drawing ---
function drawAccessory(
  ctx: CanvasRenderingContext2D,
  accessory: string,
  color: string
): void {
  // These are tiny 2-3 pixel icons drawn near the badge area
  const ax = 6, ay = 10; // badge position
  ctx.fillStyle = color;

  switch (accessory) {
    case 'stethoscope':
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(ax, ay, 1, 2);
      ctx.fillRect(ax + 1, ay + 1, 1, 1);
      break;
    case 'heart':
      ctx.fillRect(ax, ay, 1, 1);
      ctx.fillRect(ax + 1, ay + 1, 1, 1);
      ctx.fillRect(ax + 2, ay, 1, 1);
      break;
    case 'lungs':
      ctx.fillRect(ax, ay, 1, 2);
      ctx.fillRect(ax + 2, ay, 1, 2);
      ctx.fillRect(ax + 1, ay, 1, 1);
      break;
    case 'drop':
      ctx.fillRect(ax + 1, ay, 1, 1);
      ctx.fillRect(ax, ay + 1, 2, 1);
      break;
    case 'leaf':
      ctx.fillRect(ax, ay, 2, 1);
      ctx.fillRect(ax + 1, ay + 1, 1, 1);
      break;
    case 'cross':
      ctx.fillRect(ax + 1, ay, 1, 2);
      ctx.fillRect(ax, ay + 1, 2, 1);
      break;
    case 'magnifier':
      ctx.fillRect(ax, ay, 2, 2);
      ctx.fillRect(ax + 2, ay + 2, 1, 1);
      break;
    case 'film':
      ctx.fillRect(ax, ay, 2, 2);
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(ax + 1, ay, 1, 1);
      break;
    case 'pill':
      ctx.fillRect(ax, ay, 2, 1);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ax, ay + 1, 2, 1);
      break;
    case 'scale':
      ctx.fillRect(ax + 1, ay, 1, 2);
      ctx.fillRect(ax, ay, 1, 1);
      ctx.fillRect(ax + 2, ay, 1, 1);
      break;
    case 'brain':
      ctx.fillRect(ax, ay, 2, 1);
      ctx.fillRect(ax, ay + 1, 2, 1);
      break;
    case 'monitor':
      ctx.fillRect(ax, ay, 2, 2);
      ctx.fillStyle = '#34D399';
      ctx.fillRect(ax, ay, 1, 1);
      break;
    case 'target':
      ctx.fillRect(ax, ay, 2, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ax + 1, ay, 1, 1);
      break;
    case 'book':
      ctx.fillRect(ax, ay, 2, 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ax + 1, ay + 1, 1, 1);
      break;
    case 'flask':
      ctx.fillRect(ax + 1, ay, 1, 1);
      ctx.fillRect(ax, ay + 1, 2, 1);
      break;
    case 'dove':
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(ax, ay, 2, 1);
      ctx.fillRect(ax + 2, ay - 1, 1, 1);
      break;
  }
}

// ===== COUNCIL ROOM BACKGROUND =====
export function drawCouncilRoom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  memberCount: number,
  frame: number
): void {
  // Dark background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, width, height);

  // Floor tiles (checkered)
  const tileSize = 4;
  for (let y = Math.floor(height * 0.6); y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      ctx.fillStyle = isLight ? '#1E293B' : '#0F172A';
      ctx.fillRect(x, y, tileSize, tileSize);
    }
  }

  // Back wall - darker upper portion
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, width, Math.floor(height * 0.6));

  // Wall accent line
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, Math.floor(height * 0.6) - 1, width, 1);

  // Medical cross on wall (center)
  const cx = Math.floor(width / 2);
  const wy = Math.floor(height * 0.15);
  ctx.fillStyle = '#EF444466';
  ctx.fillRect(cx - 1, wy, 3, 1);
  ctx.fillRect(cx, wy - 1, 1, 3);

  // Monitor screens on wall
  const monX1 = Math.floor(width * 0.2);
  const monX2 = Math.floor(width * 0.75);
  const monY = Math.floor(height * 0.1);
  drawMonitor(ctx, monX1, monY, frame);
  drawMonitor(ctx, monX2, monY, frame);

  // Conference table (ellipse-ish, pixel style)
  const tableY = Math.floor(height * 0.55);
  const tableW = Math.min(width - 8, memberCount * 10 + 16);
  const tableX = Math.floor((width - tableW) / 2);
  // Table top
  ctx.fillStyle = '#78350F';
  ctx.fillRect(tableX + 2, tableY, tableW - 4, 3);
  ctx.fillRect(tableX + 1, tableY + 1, tableW - 2, 2);
  ctx.fillRect(tableX, tableY + 2, tableW, 1);
  // Table shadow
  ctx.fillStyle = '#451A03';
  ctx.fillRect(tableX + 1, tableY + 3, tableW - 2, 1);
  // Table legs
  ctx.fillStyle = '#92400E';
  ctx.fillRect(tableX + 3, tableY + 3, 1, 3);
  ctx.fillRect(tableX + tableW - 4, tableY + 3, 1, 3);

  // Ambient particles
  const particlePhase = frame * 0.05;
  ctx.fillStyle = '#334155';
  for (let i = 0; i < 5; i++) {
    const px = (Math.sin(particlePhase + i * 1.3) * 0.5 + 0.5) * width;
    const py = (Math.cos(particlePhase + i * 0.9) * 0.3 + 0.15) * height;
    ctx.fillRect(Math.floor(px), Math.floor(py), 1, 1);
  }
}

function drawMonitor(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  // Frame
  ctx.fillStyle = '#374151';
  ctx.fillRect(x, y, 6, 5);
  // Screen
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(x + 1, y + 1, 4, 3);
  // Blinking data line
  ctx.fillStyle = '#34D399';
  const lineW = (frame % 8) < 4 ? 3 : 2;
  ctx.fillRect(x + 1, y + 2, lineW, 1);
  // Stand
  ctx.fillStyle = '#374151';
  ctx.fillRect(x + 2, y + 5, 2, 1);
}
