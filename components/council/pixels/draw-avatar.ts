// Procedural pixel art avatar renderer — chibi style, 32x40
// Inspired by anime/RPG pixel art: big head, expressive eyes, black outlines,
// multi-shade coloring, detailed hair and accessories.

import type { CouncilSpecialist, MemberConnectionStatus } from '@/lib/council/types';

export const SPRITE_W = 32;
export const SPRITE_H = 40;

// ---- Color helpers ----
function hex(r: number, g: number, b: number): string {
  return `rgb(${r},${g},${b})`;
}

function parseHex(h: string): [number, number, number] {
  const c = h.replace('#', '');
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}

function shade(h: string, factor: number): string {
  const [r, g, b] = parseHex(h);
  const f = 1 - factor;
  return hex(Math.round(r * f), Math.round(g * f), Math.round(b * f));
}

function lighten(h: string, factor: number): string {
  const [r, g, b] = parseHex(h);
  return hex(
    Math.min(255, Math.round(r + (255 - r) * factor)),
    Math.min(255, Math.round(g + (255 - g) * factor)),
    Math.min(255, Math.round(b + (255 - b) * factor))
  );
}

// ---- Palette ----
interface Palette {
  outline: string;
  skin: string;
  skinShade: string;
  skinHi: string;
  hair: string;
  hairShade: string;
  hairHi: string;
  eyeColor: string;
  coat: string;
  coatShade: string;
  accent: string;
  accentShade: string;
  pants: string;
  pantsShade: string;
  shoes: string;
  blush: string;
}

function buildPalette(v: SpecialistVisual): Palette {
  return {
    outline: '#1A1A2E',
    skin: v.skinTone,
    skinShade: shade(v.skinTone, 0.2),
    skinHi: lighten(v.skinTone, 0.2),
    hair: v.hairColor,
    hairShade: shade(v.hairColor, 0.3),
    hairHi: lighten(v.hairColor, 0.3),
    eyeColor: v.eyeColor || '#2563EB',
    coat: '#F1F5F9',
    coatShade: '#CBD5E1',
    accent: v.accentColor,
    accentShade: shade(v.accentColor, 0.3),
    pants: '#334155',
    pantsShade: '#1E293B',
    shoes: '#1E293B',
    blush: '#F9A8D4',
  };
}

// ---- Skin tones ----
const SKIN = {
  light: '#FDDCB5',
  medLight: '#E8B88A',
  medium: '#C6945A',
  medDark: '#8D5524',
  dark: '#5C3310',
};

// ---- Per-specialist config ----
interface SpecialistVisual {
  hairStyle: number;
  hairColor: string;
  skinTone: string;
  accentColor: string;
  eyeColor: string;
  accessory: string;
}

const VISUALS: Record<CouncilSpecialist, SpecialistVisual> = {
  attending:       { hairStyle: 0, hairColor: '#9CA3AF', skinTone: SKIN.light,    accentColor: '#8B5CF6', eyeColor: '#6366F1', accessory: 'stethoscope' },
  cardiologist:    { hairStyle: 1, hairColor: '#1C1917', skinTone: SKIN.medium,   accentColor: '#EF4444', eyeColor: '#92400E', accessory: 'heart' },
  pulmonologist:   { hairStyle: 2, hairColor: '#92400E', skinTone: SKIN.light,    accentColor: '#06B6D4', eyeColor: '#0891B2', accessory: 'lungs' },
  nephrologist:    { hairStyle: 3, hairColor: '#0C0A09', skinTone: SKIN.medDark,  accentColor: '#3B82F6', eyeColor: '#1D4ED8', accessory: 'drop' },
  hepatologist:    { hairStyle: 4, hairColor: '#B91C1C', skinTone: SKIN.medLight, accentColor: '#84CC16', eyeColor: '#15803D', accessory: 'leaf' },
  hematologist:    { hairStyle: 5, hairColor: '#44403C', skinTone: SKIN.dark,     accentColor: '#DC2626', eyeColor: '#DC2626', accessory: 'cross' },
  id_specialist:   { hairStyle: 6, hairColor: '#78350F', skinTone: SKIN.medLight, accentColor: '#F59E0B', eyeColor: '#B45309', accessory: 'magnifier' },
  radiologist:     { hairStyle: 7, hairColor: '#0C0A09', skinTone: SKIN.light,    accentColor: '#6366F1', eyeColor: '#4338CA', accessory: 'film' },
  pharmacist:      { hairStyle: 1, hairColor: '#CA8A04', skinTone: SKIN.medium,   accentColor: '#10B981', eyeColor: '#059669', accessory: 'pill' },
  endocrinologist: { hairStyle: 2, hairColor: '#0C0A09', skinTone: SKIN.medDark,  accentColor: '#EC4899', eyeColor: '#BE185D', accessory: 'scale' },
  neurologist:     { hairStyle: 5, hairColor: '#6B21A8', skinTone: SKIN.medLight, accentColor: '#A855F7', eyeColor: '#7C3AED', accessory: 'brain' },
  intensivist:     { hairStyle: 3, hairColor: '#292524', skinTone: SKIN.dark,     accentColor: '#F97316', eyeColor: '#EA580C', accessory: 'monitor' },
  oncologist:      { hairStyle: 6, hairColor: '#9A3412', skinTone: SKIN.light,    accentColor: '#14B8A6', eyeColor: '#0D9488', accessory: 'target' },
  psychiatrist:    { hairStyle: 4, hairColor: '#D1D5DB', skinTone: SKIN.medium,   accentColor: '#8B5CF6', eyeColor: '#6D28D9', accessory: 'book' },
  toxicologist:    { hairStyle: 7, hairColor: '#4D7C0F', skinTone: SKIN.medLight, accentColor: '#FBBF24', eyeColor: '#A16207', accessory: 'flask' },
  palliative:      { hairStyle: 0, hairColor: '#78350F', skinTone: SKIN.medDark,  accentColor: '#F9A8D4', eyeColor: '#BE185D', accessory: 'dove' },
};

// ---- Drawing helpers ----
type Ctx = CanvasRenderingContext2D;

function px(ctx: Ctx, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function hline(ctx: Ctx, x1: number, x2: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x1, y, x2 - x1 + 1, 1);
}

function vline(ctx: Ctx, x: number, y1: number, y2: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y1, 1, y2 - y1 + 1);
}

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Draw outlined rectangle (outline + fill)
function oRect(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, outline: string) {
  // Outline
  rect(ctx, x, y, w, 1, outline);         // top
  rect(ctx, x, y + h - 1, w, 1, outline); // bottom
  rect(ctx, x, y, 1, h, outline);         // left
  rect(ctx, x + w - 1, y, 1, h, outline); // right
  // Fill
  if (w > 2 && h > 2) {
    rect(ctx, x + 1, y + 1, w - 2, h - 2, fill);
  }
}

// ===== MAIN DRAW FUNCTION =====
export function drawAvatar(
  ctx: Ctx,
  specialist: CouncilSpecialist,
  status: MemberConnectionStatus,
  frame: number
): void {
  const v = VISUALS[specialist];
  const p = buildPalette(v);
  ctx.clearRect(0, 0, SPRITE_W, SPRITE_H);

  const breatheY = (status === 'idle' || status === 'connected') ? Math.round(Math.sin(frame * 0.15) * 0.8) : 0;
  const isHandUp = status === 'hand_raised';
  const isSpeaking = status === 'speaking';

  ctx.save();
  ctx.translate(0, breatheY);

  // Layer order: hair back → body → head → face → hair front → accessory
  drawHairBack(ctx, v.hairStyle, p);
  drawBody(ctx, p, isHandUp);
  drawHead(ctx, p);
  drawFace(ctx, p, isSpeaking, frame);
  drawHairFront(ctx, v.hairStyle, p);
  drawAccessoryIcon(ctx, v.accessory, p);

  ctx.restore();

  // Status overlays (no breathe offset)
  drawStatusOverlay(ctx, status, frame, p);
}

// ===== HEAD =====
function drawHead(ctx: Ctx, p: Palette) {
  const O = p.outline;
  // Head shape: oval, ~16px wide, centered at x=8..23, y=4..19
  // Outline
  hline(ctx, 11, 20, 4, O);
  hline(ctx, 9, 22, 5, O);
  px(ctx, 8, 6, O); px(ctx, 23, 6, O);
  vline(ctx, 7, 7, 17, O);
  vline(ctx, 24, 7, 17, O);
  px(ctx, 8, 18, O); px(ctx, 23, 18, O);
  hline(ctx, 9, 22, 19, O);
  hline(ctx, 11, 20, 20, O);
  // Extra outline pixels for roundness
  px(ctx, 9, 5, O); px(ctx, 10, 5, O);
  px(ctx, 21, 5, O); px(ctx, 22, 5, O);
  px(ctx, 8, 6, O); px(ctx, 23, 6, O);
  px(ctx, 9, 18, O); px(ctx, 22, 18, O);
  px(ctx, 10, 19, O); px(ctx, 21, 19, O);

  // Fill skin
  rect(ctx, 11, 5, 10, 1, p.skin);
  rect(ctx, 9, 6, 14, 1, p.skin);
  rect(ctx, 8, 7, 16, 11, p.skin);
  rect(ctx, 9, 18, 14, 1, p.skin);
  rect(ctx, 11, 19, 10, 1, p.skin);

  // Skin shading (right side shadow)
  vline(ctx, 22, 7, 17, p.skinShade);
  vline(ctx, 23, 8, 16, p.skinShade);
  rect(ctx, 20, 18, 3, 1, p.skinShade);

  // Skin highlight (left cheek area)
  rect(ctx, 9, 8, 2, 2, p.skinHi);

  // Blush (cheeks)
  px(ctx, 9, 15, p.blush);
  px(ctx, 10, 15, p.blush);
  px(ctx, 21, 15, p.blush);
  px(ctx, 22, 15, p.blush);
}

// ===== FACE =====
function drawFace(ctx: Ctx, p: Palette, isSpeaking: boolean, frame: number) {
  const O = p.outline;

  // ----- EYES -----
  // Left eye: x 9-13, y 10-14
  // Right eye: x 18-22, y 10-14

  // Eye whites
  rect(ctx, 10, 10, 4, 4, '#FFFFFF');
  rect(ctx, 18, 10, 4, 4, '#FFFFFF');
  // Eye outlines (top and bottom)
  hline(ctx, 10, 13, 9, O);
  hline(ctx, 18, 21, 9, O);
  px(ctx, 9, 10, O); px(ctx, 14, 10, O);
  px(ctx, 17, 10, O); px(ctx, 22, 10, O);
  px(ctx, 9, 13, O); px(ctx, 14, 13, O);
  px(ctx, 17, 13, O); px(ctx, 22, 13, O);
  hline(ctx, 10, 13, 14, O);
  hline(ctx, 18, 21, 14, O);

  // Iris (colored)
  rect(ctx, 11, 11, 3, 3, p.eyeColor);
  rect(ctx, 19, 11, 3, 3, p.eyeColor);

  // Pupils
  px(ctx, 12, 11, O); px(ctx, 12, 12, O);
  px(ctx, 20, 11, O); px(ctx, 20, 12, O);

  // Eye shine (white highlight)
  px(ctx, 11, 10, '#FFFFFF');
  px(ctx, 19, 10, '#FFFFFF');

  // Eyelashes (top)
  px(ctx, 9, 9, O); px(ctx, 14, 9, O);
  px(ctx, 17, 9, O); px(ctx, 22, 9, O);

  // ----- EYEBROWS -----
  hline(ctx, 10, 13, 8, O);
  hline(ctx, 18, 21, 8, O);

  // ----- NOSE -----
  px(ctx, 15, 15, p.skinShade);
  px(ctx, 16, 15, p.skinShade);

  // ----- MOUTH -----
  if (isSpeaking && frame % 8 < 4) {
    // Open mouth
    hline(ctx, 13, 18, 17, O);
    hline(ctx, 14, 17, 18, O);
    rect(ctx, 14, 17, 4, 1, '#7F1D1D');
  } else {
    // Closed / slight smile
    hline(ctx, 14, 17, 17, p.skinShade);
    px(ctx, 13, 17, O);
    px(ctx, 18, 17, O);
  }
}

// ===== BODY =====
function drawBody(ctx: Ctx, p: Palette, isHandUp: boolean) {
  const O = p.outline;

  // ----- NECK -----
  rect(ctx, 14, 20, 4, 2, p.skin);
  vline(ctx, 13, 20, 21, O);
  vline(ctx, 18, 20, 21, O);

  // ----- TORSO (white coat) -----
  // Outline
  hline(ctx, 8, 23, 22, O);
  vline(ctx, 7, 23, 33, O);
  vline(ctx, 24, 23, 33, O);
  hline(ctx, 8, 23, 34, O);

  // Fill coat
  rect(ctx, 8, 23, 16, 11, p.coat);

  // Coat shading
  rect(ctx, 21, 23, 3, 11, p.coatShade);
  hline(ctx, 8, 23, 33, p.coatShade);

  // Collar V
  px(ctx, 14, 22, O); px(ctx, 17, 22, O);
  px(ctx, 13, 23, O); px(ctx, 18, 23, O);
  px(ctx, 14, 23, p.skin); px(ctx, 15, 23, p.skin);
  px(ctx, 16, 23, p.skin); px(ctx, 17, 23, p.skin);

  // Coat center line
  vline(ctx, 15, 24, 33, p.coatShade);

  // Coat buttons
  px(ctx, 16, 26, p.outline);
  px(ctx, 16, 29, p.outline);

  // ----- ACCENT BADGE -----
  rect(ctx, 9, 25, 4, 4, p.accent);
  rect(ctx, 9, 25, 4, 1, p.accentShade);

  // ----- ARMS -----
  if (isHandUp) {
    // Left arm down
    vline(ctx, 6, 23, 33, O);
    rect(ctx, 5, 23, 2, 11, p.coat);
    vline(ctx, 4, 23, 33, O);
    // Left hand
    rect(ctx, 4, 34, 3, 2, p.skin);
    hline(ctx, 4, 6, 36, O);

    // Right arm UP
    vline(ctx, 25, 14, 22, O);
    vline(ctx, 28, 14, 22, O);
    rect(ctx, 26, 14, 2, 9, p.coat);
    // Right hand up
    rect(ctx, 25, 11, 4, 3, p.skin);
    hline(ctx, 25, 28, 10, O);
    px(ctx, 24, 11, O); px(ctx, 29, 11, O);
    px(ctx, 24, 12, O); px(ctx, 29, 12, O);
    hline(ctx, 25, 28, 13, O);
  } else {
    // Both arms down
    // Left
    vline(ctx, 6, 23, 33, O);
    rect(ctx, 5, 23, 2, 11, p.coat);
    vline(ctx, 4, 23, 33, O);
    rect(ctx, 4, 34, 3, 2, p.skin);
    hline(ctx, 4, 6, 36, O);
    // Right
    vline(ctx, 25, 23, 33, O);
    rect(ctx, 26, 23, 2, 11, p.coat);
    vline(ctx, 28, 23, 33, O);
    rect(ctx, 26, 34, 3, 2, p.skin);
    hline(ctx, 25, 28, 36, O);
  }

  // ----- PANTS -----
  rect(ctx, 10, 34, 5, 3, p.pants);
  rect(ctx, 17, 34, 5, 3, p.pants);
  vline(ctx, 9, 34, 36, O);
  vline(ctx, 15, 34, 36, O);
  vline(ctx, 16, 34, 36, O);
  vline(ctx, 22, 34, 36, O);
  // Pant shading
  vline(ctx, 14, 34, 36, p.pantsShade);
  vline(ctx, 21, 34, 36, p.pantsShade);

  // ----- SHOES -----
  rect(ctx, 9, 37, 6, 2, p.shoes);
  rect(ctx, 17, 37, 6, 2, p.shoes);
  hline(ctx, 8, 15, 37, O);
  hline(ctx, 16, 23, 37, O);
  hline(ctx, 8, 15, 39, O);
  hline(ctx, 16, 23, 39, O);
  vline(ctx, 8, 37, 39, O);
  vline(ctx, 23, 37, 39, O);
  // Shoe highlight
  hline(ctx, 10, 13, 37, lighten(p.shoes, 0.3));
  hline(ctx, 18, 21, 37, lighten(p.shoes, 0.3));
}

// ===== HAIR STYLES =====
// Each style draws hair behind and in front of the head.
// Hair covers y=0..8 (above head) and sides y=6..18

type HairFn = (ctx: Ctx, p: Palette, isFront: boolean) => void;

const HAIR: Record<number, HairFn> = {
  // 0: Short neat (parted) — for Chief, Grace
  0: (ctx, p, front) => {
    const { hair: H, hairShade: D, hairHi: L, outline: O } = p;
    if (!front) {
      // Back
      rect(ctx, 9, 2, 14, 3, H);
      rect(ctx, 7, 4, 18, 4, H);
      hline(ctx, 9, 22, 1, O);
      px(ctx, 8, 2, O); px(ctx, 23, 2, O);
      vline(ctx, 6, 4, 8, O);
      vline(ctx, 25, 4, 8, O);
      // Shade
      rect(ctx, 20, 3, 4, 4, D);
      // Highlight
      rect(ctx, 11, 2, 3, 2, L);
    } else {
      // Front: bangs
      hline(ctx, 9, 14, 5, H);
      hline(ctx, 9, 12, 6, H);
      hline(ctx, 9, 11, 7, D);
      // Side hair
      rect(ctx, 7, 7, 2, 6, H);
      rect(ctx, 23, 7, 2, 6, H);
      vline(ctx, 6, 7, 12, O);
      vline(ctx, 25, 7, 12, O);
    }
  },

  // 1: Spiky/messy — for Cardi, Rex
  1: (ctx, p, front) => {
    const { hair: H, hairShade: D, hairHi: L, outline: O } = p;
    if (!front) {
      rect(ctx, 8, 1, 16, 7, H);
      hline(ctx, 10, 21, 0, O);
      px(ctx, 7, 1, O); px(ctx, 24, 1, O);
      vline(ctx, 6, 2, 8, O);
      vline(ctx, 25, 2, 8, O);
      // Spikes
      px(ctx, 8, 0, O); px(ctx, 9, 0, H);
      px(ctx, 13, 0, O); px(ctx, 14, 0, H);
      px(ctx, 19, 0, H); px(ctx, 20, 0, O);
      px(ctx, 23, 0, O);
      // Shade
      rect(ctx, 19, 2, 5, 5, D);
      rect(ctx, 10, 2, 4, 2, L);
    } else {
      // Messy bangs
      hline(ctx, 8, 20, 5, H);
      hline(ctx, 8, 18, 6, H);
      hline(ctx, 8, 15, 7, D);
      px(ctx, 10, 8, D);
      px(ctx, 14, 7, H);
      // Sides
      rect(ctx, 6, 6, 3, 8, H);
      rect(ctx, 23, 6, 3, 8, H);
      vline(ctx, 5, 6, 13, O);
      vline(ctx, 26, 6, 13, O);
      px(ctx, 5, 5, O);
    }
  },

  // 2: Side-swept long — for Breezy, Harmony
  2: (ctx, p, front) => {
    const { hair: H, hairShade: D, hairHi: L, outline: O } = p;
    if (!front) {
      rect(ctx, 8, 1, 16, 7, H);
      hline(ctx, 10, 21, 0, O);
      px(ctx, 7, 1, O); px(ctx, 24, 1, O);
      vline(ctx, 6, 2, 8, O);
      vline(ctx, 25, 2, 8, O);
      rect(ctx, 19, 2, 5, 5, D);
      rect(ctx, 11, 1, 3, 2, L);
    } else {
      // Swept bangs (left to right)
      hline(ctx, 8, 21, 5, H);
      hline(ctx, 8, 19, 6, H);
      hline(ctx, 8, 16, 7, D);
      px(ctx, 8, 8, D);
      // Long side hair
      rect(ctx, 6, 6, 3, 14, H);
      rect(ctx, 23, 6, 3, 14, H);
      vline(ctx, 5, 6, 19, O);
      vline(ctx, 26, 6, 19, O);
      // Left side longer
      rect(ctx, 5, 14, 2, 6, H);
      vline(ctx, 4, 14, 19, O);
      px(ctx, 5, 20, O);
      // Shade on sides
      vline(ctx, 24, 8, 18, D);
    }
  },

  // 3: Buzz cut / very short — for Rio, Vigil
  3: (ctx, p, front) => {
    const { hair: H, hairShade: D, outline: O } = p;
    if (!front) {
      rect(ctx, 9, 3, 14, 3, H);
      hline(ctx, 10, 21, 2, O);
      px(ctx, 8, 3, O); px(ctx, 23, 3, O);
      vline(ctx, 7, 4, 7, O);
      vline(ctx, 24, 4, 7, O);
      rect(ctx, 19, 3, 4, 3, D);
    } else {
      // Very thin bangs
      hline(ctx, 9, 20, 5, H);
      hline(ctx, 9, 17, 6, D);
      // Minimal sides
      rect(ctx, 7, 6, 2, 5, H);
      rect(ctx, 23, 6, 2, 5, H);
      vline(ctx, 6, 6, 10, O);
      vline(ctx, 25, 6, 10, O);
    }
  },

  // 4: Bun / updo — for Liv, Sage
  4: (ctx, p, front) => {
    const { hair: H, hairShade: D, hairHi: L, outline: O } = p;
    if (!front) {
      // Bun on top
      rect(ctx, 12, 0, 8, 3, H);
      hline(ctx, 13, 19, 0, O);
      px(ctx, 11, 1, O); px(ctx, 20, 1, O);
      hline(ctx, 12, 19, 3, O);
      rect(ctx, 16, 0, 3, 2, D);
      rect(ctx, 13, 0, 2, 1, L);
      // Base hair
      rect(ctx, 8, 3, 16, 5, H);
      vline(ctx, 7, 4, 8, O);
      vline(ctx, 24, 4, 8, O);
      rect(ctx, 19, 3, 4, 5, D);
    } else {
      // Clean bangs
      hline(ctx, 9, 20, 5, H);
      hline(ctx, 10, 18, 6, H);
      hline(ctx, 11, 16, 7, D);
      // Sides (shorter)
      rect(ctx, 7, 6, 2, 8, H);
      rect(ctx, 23, 6, 2, 8, H);
      vline(ctx, 6, 6, 13, O);
      vline(ctx, 25, 6, 13, O);
    }
  },

  // 5: Curly/voluminous — for Ruby, Nova
  5: (ctx, p, front) => {
    const { hair: H, hairShade: D, hairHi: L, outline: O } = p;
    if (!front) {
      rect(ctx, 7, 0, 18, 8, H);
      hline(ctx, 9, 22, 0, O);
      px(ctx, 6, 1, O); px(ctx, 25, 1, O);
      vline(ctx, 5, 2, 8, O);
      vline(ctx, 26, 2, 8, O);
      // Curly texture
      px(ctx, 8, 1, D); px(ctx, 12, 1, L);
      px(ctx, 16, 2, D); px(ctx, 20, 1, L);
      px(ctx, 10, 3, D); px(ctx, 14, 2, L);
      px(ctx, 22, 3, D);
      rect(ctx, 21, 2, 4, 5, D);
    } else {
      // Big curly bangs
      hline(ctx, 7, 22, 5, H);
      hline(ctx, 7, 21, 6, H);
      hline(ctx, 8, 18, 7, D);
      hline(ctx, 9, 15, 8, D);
      px(ctx, 8, 6, L); px(ctx, 12, 5, L);
      // Wide curly sides
      rect(ctx, 5, 6, 4, 14, H);
      rect(ctx, 23, 6, 4, 14, H);
      vline(ctx, 4, 6, 19, O);
      vline(ctx, 27, 6, 19, O);
      px(ctx, 4, 20, O); px(ctx, 27, 20, O);
      // Curl texture on sides
      px(ctx, 5, 9, D); px(ctx, 6, 13, D);
      px(ctx, 25, 10, D); px(ctx, 26, 14, D);
    }
  },

  // 6: Short with cap/headband — for Scout, Archer
  6: (ctx, p, front) => {
    const { hair: H, hairShade: D, outline: O } = p;
    if (!front) {
      rect(ctx, 9, 2, 14, 5, H);
      hline(ctx, 10, 21, 1, O);
      px(ctx, 8, 2, O); px(ctx, 23, 2, O);
      vline(ctx, 7, 3, 7, O);
      vline(ctx, 24, 3, 7, O);
      rect(ctx, 19, 2, 4, 4, D);
    } else {
      // Short bangs with headband accent
      hline(ctx, 9, 20, 5, H);
      hline(ctx, 9, 16, 6, D);
      // Headband
      hline(ctx, 7, 24, 4, p.accent);
      hline(ctx, 7, 24, 3, p.accentShade);
      // Short sides
      rect(ctx, 7, 5, 2, 7, H);
      rect(ctx, 23, 5, 2, 7, H);
      vline(ctx, 6, 5, 11, O);
      vline(ctx, 25, 5, 11, O);
    }
  },

  // 7: Straight long — for Ray, Vex
  7: (ctx, p, front) => {
    const { hair: H, hairShade: D, hairHi: L, outline: O } = p;
    if (!front) {
      rect(ctx, 8, 1, 16, 7, H);
      hline(ctx, 10, 21, 0, O);
      px(ctx, 7, 1, O); px(ctx, 24, 1, O);
      vline(ctx, 6, 2, 8, O);
      vline(ctx, 25, 2, 8, O);
      rect(ctx, 20, 1, 3, 6, D);
      rect(ctx, 10, 1, 3, 2, L);
    } else {
      // Straight bangs (hime cut style)
      hline(ctx, 8, 22, 5, H);
      hline(ctx, 8, 22, 6, H);
      hline(ctx, 8, 22, 7, D);
      // Long straight sides
      rect(ctx, 6, 6, 3, 16, H);
      rect(ctx, 23, 6, 3, 16, H);
      vline(ctx, 5, 6, 21, O);
      vline(ctx, 26, 6, 21, O);
      px(ctx, 6, 22, O); px(ctx, 25, 22, O);
      // Shade
      vline(ctx, 24, 8, 20, D);
      vline(ctx, 7, 16, 20, D);
    }
  },
};

function drawHairBack(ctx: Ctx, style: number, p: Palette) {
  (HAIR[style] || HAIR[0])(ctx, p, false);
}

function drawHairFront(ctx: Ctx, style: number, p: Palette) {
  (HAIR[style] || HAIR[0])(ctx, p, true);
}

// ===== ACCESSORIES =====
function drawAccessoryIcon(ctx: Ctx, accessory: string, p: Palette) {
  // Drawn on the coat badge area (x 9-12, y 25-28)
  const A = p.accent;
  const D = p.accentShade;

  switch (accessory) {
    case 'stethoscope':
      // Stethoscope around neck
      px(ctx, 13, 22, '#94A3B8');
      px(ctx, 18, 22, '#94A3B8');
      vline(ctx, 12, 23, 26, '#94A3B8');
      hline(ctx, 10, 12, 27, '#94A3B8');
      px(ctx, 10, 28, '#64748B');
      px(ctx, 11, 28, '#64748B');
      break;
    case 'heart':
      px(ctx, 9, 25, A); px(ctx, 10, 25, A);
      px(ctx, 12, 25, A); px(ctx, 13, 25, A);
      rect(ctx, 9, 26, 5, 2, A);
      px(ctx, 10, 28, A); px(ctx, 11, 28, A); px(ctx, 12, 28, A);
      px(ctx, 11, 29, A);
      px(ctx, 10, 25, D);
      break;
    case 'lungs':
      vline(ctx, 11, 25, 28, A);
      rect(ctx, 9, 25, 2, 3, A);
      rect(ctx, 12, 25, 2, 3, A);
      px(ctx, 9, 27, D); px(ctx, 13, 27, D);
      break;
    case 'drop':
      px(ctx, 11, 25, A);
      rect(ctx, 10, 26, 3, 2, A);
      px(ctx, 11, 28, A);
      px(ctx, 11, 26, lighten(A, 0.3));
      break;
    case 'leaf':
      rect(ctx, 9, 25, 4, 3, A);
      px(ctx, 10, 28, A); px(ctx, 12, 28, A);
      vline(ctx, 11, 25, 28, D);
      break;
    case 'cross':
      vline(ctx, 11, 25, 28, A);
      hline(ctx, 10, 12, 26, A);
      px(ctx, 11, 25, D);
      break;
    case 'magnifier':
      rect(ctx, 9, 25, 3, 3, A);
      rect(ctx, 10, 26, 1, 1, lighten(A, 0.4));
      px(ctx, 12, 28, D);
      px(ctx, 13, 29, D);
      break;
    case 'film':
      rect(ctx, 9, 25, 4, 4, '#334155');
      rect(ctx, 10, 26, 2, 2, '#94A3B8');
      px(ctx, 9, 25, A); px(ctx, 12, 25, A);
      px(ctx, 9, 28, A); px(ctx, 12, 28, A);
      break;
    case 'pill':
      rect(ctx, 9, 26, 4, 2, A);
      rect(ctx, 11, 26, 2, 2, '#FFFFFF');
      hline(ctx, 9, 12, 25, p.outline);
      hline(ctx, 9, 12, 28, p.outline);
      break;
    case 'scale':
      px(ctx, 11, 25, A);
      hline(ctx, 9, 13, 26, A);
      px(ctx, 9, 27, A); px(ctx, 13, 27, A);
      px(ctx, 10, 28, A); px(ctx, 12, 28, A);
      break;
    case 'brain':
      rect(ctx, 9, 25, 4, 3, A);
      px(ctx, 10, 25, D); px(ctx, 12, 26, D);
      px(ctx, 9, 27, D); px(ctx, 11, 27, D);
      break;
    case 'monitor':
      rect(ctx, 9, 25, 4, 3, '#334155');
      rect(ctx, 10, 26, 2, 1, '#0F172A');
      px(ctx, 10, 26, '#34D399');
      px(ctx, 11, 28, '#334155');
      break;
    case 'target':
      rect(ctx, 9, 25, 4, 4, A);
      rect(ctx, 10, 26, 2, 2, '#FFFFFF');
      px(ctx, 11, 27, A);
      break;
    case 'book':
      rect(ctx, 9, 25, 4, 4, A);
      vline(ctx, 10, 25, 28, '#FFFFFF');
      rect(ctx, 11, 26, 2, 2, lighten(A, 0.3));
      break;
    case 'flask':
      px(ctx, 11, 25, A);
      hline(ctx, 10, 12, 25, p.outline);
      rect(ctx, 9, 26, 5, 3, A);
      px(ctx, 10, 27, lighten(A, 0.4));
      break;
    case 'dove':
      rect(ctx, 10, 25, 3, 2, '#FFFFFF');
      px(ctx, 13, 24, '#FFFFFF');
      px(ctx, 9, 26, '#FFFFFF');
      px(ctx, 11, 27, '#E2E8F0');
      px(ctx, 12, 25, '#CBD5E1');
      break;
  }
}

// ===== STATUS OVERLAYS =====
function drawStatusOverlay(ctx: Ctx, status: MemberConnectionStatus, frame: number, p: Palette) {
  switch (status) {
    case 'hand_raised': {
      // Sparkles near raised hand
      const sparkle = frame % 6 < 3;
      if (sparkle) {
        px(ctx, 29, 8, '#FBBF24');
        px(ctx, 28, 7, '#FBBF24');
        px(ctx, 30, 7, '#FBBF24');
        px(ctx, 29, 6, '#FBBF24');
        // Second sparkle
        px(ctx, 27, 5, '#FDE68A');
        px(ctx, 31, 9, '#FDE68A');
      } else {
        px(ctx, 28, 6, '#FDE68A');
        px(ctx, 30, 8, '#FDE68A');
      }
      break;
    }

    case 'speaking': {
      // Sound waves on the left
      const wf = frame % 12;
      const wc = p.accent;
      if (wf < 4) {
        vline(ctx, 1, 12, 14, wc);
      } else if (wf < 8) {
        vline(ctx, 1, 11, 15, wc);
        vline(ctx, 0, 12, 14, wc);
      } else {
        vline(ctx, 2, 10, 16, wc);
        vline(ctx, 1, 11, 15, wc);
        vline(ctx, 0, 12, 14, wc);
      }
      break;
    }

    case 'listening': {
      // Subtle "..." thought indicator
      if (frame % 16 < 8) {
        px(ctx, 26, 3, '#94A3B8');
        px(ctx, 28, 3, '#94A3B8');
        px(ctx, 30, 3, '#94A3B8');
      }
      break;
    }

    case 'connecting': {
      // Loading dots
      const dot = frame % 12;
      const dc = p.accent;
      if (dot < 4) px(ctx, 14, 0, dc);
      else if (dot < 8) { px(ctx, 14, 0, dc); px(ctx, 16, 0, dc); }
      else { px(ctx, 14, 0, dc); px(ctx, 16, 0, dc); px(ctx, 18, 0, dc); }
      break;
    }

    case 'disconnected':
    case 'error': {
      // Red X overlay
      ctx.fillStyle = '#EF444444';
      ctx.fillRect(0, 0, SPRITE_W, SPRITE_H);
      const xc = '#EF4444';
      // Big X
      px(ctx, 3, 2, xc); px(ctx, 4, 3, xc); px(ctx, 5, 4, xc);
      px(ctx, 7, 2, xc); px(ctx, 6, 3, xc); px(ctx, 5, 4, xc);
      px(ctx, 4, 5, xc); px(ctx, 6, 5, xc);
      px(ctx, 3, 6, xc); px(ctx, 7, 6, xc);
      break;
    }
  }
}

// ===== COUNCIL ROOM BACKGROUND =====
export function drawCouncilRoom(
  ctx: Ctx,
  width: number,
  height: number,
  memberCount: number,
  frame: number
): void {
  // Dark background
  rect(ctx, 0, 0, width, height, '#0F172A');

  // Floor tiles
  const tileSize = 6;
  const floorY = Math.floor(height * 0.55);
  for (let y = floorY; y < height; y += tileSize) {
    for (let x = 0; x < width; x += tileSize) {
      const isLight = ((x / tileSize) + (y / tileSize)) % 2 === 0;
      rect(ctx, x, y, tileSize, tileSize, isLight ? '#1E293B' : '#172033');
    }
  }

  // Wall
  rect(ctx, 0, 0, width, floorY, '#1E293B');

  // Wall accent line
  hline(ctx, 0, width - 1, floorY - 1, '#334155');
  hline(ctx, 0, width - 1, floorY, '#475569');

  // Wainscoting
  rect(ctx, 0, floorY - 6, width, 5, '#253345');
  hline(ctx, 0, width - 1, floorY - 7, '#334155');

  // Medical cross on wall
  const cx = Math.floor(width / 2);
  const wy = Math.floor(height * 0.12);
  rect(ctx, cx - 1, wy - 3, 3, 7, '#EF444455');
  rect(ctx, cx - 3, wy - 1, 7, 3, '#EF444455');

  // Wall monitors
  drawWallMonitor(ctx, Math.floor(width * 0.18), Math.floor(height * 0.08), frame);
  drawWallMonitor(ctx, Math.floor(width * 0.72), Math.floor(height * 0.08), frame);

  // Conference table
  const tableW = Math.min(width - 12, memberCount * 12 + 24);
  const tableX = Math.floor((width - tableW) / 2);
  const tableY = Math.floor(height * 0.52);
  // Table top
  rect(ctx, tableX + 3, tableY, tableW - 6, 4, '#92400E');
  rect(ctx, tableX + 2, tableY + 1, tableW - 4, 3, '#78350F');
  rect(ctx, tableX + 1, tableY + 2, tableW - 2, 2, '#78350F');
  // Highlight
  hline(ctx, tableX + 4, tableX + tableW - 5, tableY, '#B45309');
  // Shadow
  rect(ctx, tableX + 2, tableY + 4, tableW - 4, 2, '#451A03');
  // Legs
  rect(ctx, tableX + 4, tableY + 4, 2, 5, '#92400E');
  rect(ctx, tableX + tableW - 6, tableY + 4, 2, 5, '#92400E');

  // Ambient particles
  const phase = frame * 0.04;
  for (let i = 0; i < 6; i++) {
    const px_ = (Math.sin(phase + i * 1.7) * 0.45 + 0.5) * width;
    const py = (Math.cos(phase + i * 1.1) * 0.2 + 0.2) * height;
    px(ctx, Math.floor(px_), Math.floor(py), '#33415544');
  }
}

function drawWallMonitor(ctx: Ctx, x: number, y: number, frame: number) {
  // Frame
  rect(ctx, x, y, 10, 7, '#475569');
  // Bezel
  rect(ctx, x + 1, y + 1, 8, 5, '#334155');
  // Screen
  rect(ctx, x + 2, y + 2, 6, 3, '#0F172A');
  // Blinking line
  const lw = [2, 3, 4, 3][(frame >> 2) % 4];
  hline(ctx, x + 2, x + 1 + lw, y + 3, '#34D399');
  px(ctx, x + 2, y + 2, '#22D3EE44');
  // Stand
  rect(ctx, x + 4, y + 7, 2, 2, '#475569');
  hline(ctx, x + 3, x + 6, y + 9, '#475569');
}
