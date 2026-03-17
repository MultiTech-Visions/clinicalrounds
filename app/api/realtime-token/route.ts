import { NextRequest, NextResponse } from 'next/server';

// Allowed models and voices — prevent callers from using arbitrary values
const ALLOWED_MODELS = new Set(['gpt-4o-realtime-preview', 'gpt-4o-mini-realtime-preview']);
const ALLOWED_VOICES = new Set(['ash', 'coral', 'shimmer', 'echo', 'sage', 'ballad', 'verse', 'alloy']);

// Max instructions length (characters) to prevent abuse
const MAX_INSTRUCTIONS_LENGTH = 50_000;

// Simple in-memory rate limit: max requests per IP per window
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// POST /api/realtime-token
// Returns an ephemeral token for the OpenAI Realtime API WebRTC connection
export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY not configured' },
      { status: 500 }
    );
  }

  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Validate model
  const model = typeof body.model === 'string' && ALLOWED_MODELS.has(body.model)
    ? body.model
    : 'gpt-4o-realtime-preview';

  // Validate voice
  const voice = typeof body.voice === 'string' && ALLOWED_VOICES.has(body.voice)
    ? body.voice
    : 'ash';

  // Validate instructions length
  const instructions = typeof body.instructions === 'string'
    ? body.instructions.slice(0, MAX_INSTRUCTIONS_LENGTH)
    : '';

  // Only forward our predefined tools — ignore client-supplied tools entirely.
  // The tools are defined server-side in parliamentary-prompts.ts and sent by
  // the client for convenience, but we validate the shape here.
  const tools = Array.isArray(body.tools)
    ? body.tools.filter(
        (t: unknown) =>
          typeof t === 'object' && t !== null &&
          typeof (t as Record<string, unknown>).name === 'string' &&
          ['post_to_chat', 'request_floor', 'point_of_order'].includes(
            (t as Record<string, string>).name
          )
      )
    : [];

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        voice,
        instructions,
        tools,
        input_audio_transcription: {
          model: 'gpt-4o-mini-transcribe',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Realtime session error:', response.status, errorText);
      // Map upstream errors to generic server error — don't leak upstream details
      const status = response.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: status === 429 ? 'Rate limited by upstream API' : 'Upstream API error' },
        { status }
      );
    }

    const data = await response.json();

    // Only return the fields the client needs
    return NextResponse.json({
      client_secret: data.client_secret,
      expires_at: data.expires_at,
    });
  } catch (error) {
    console.error('Failed to create realtime session:', error);
    return NextResponse.json(
      { error: 'Failed to create realtime session' },
      { status: 500 }
    );
  }
}
