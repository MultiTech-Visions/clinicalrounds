import { NextRequest, NextResponse } from 'next/server';

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

  try {
    const body = await req.json();
    const { model, voice, instructions } = body;

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-realtime-preview',
        voice: voice || 'ash',
        instructions: instructions || '',
        tools: body.tools || [],
        input_audio_transcription: {
          model: 'gpt-4o-mini-transcription',
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
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to create realtime session:', error);
    return NextResponse.json(
      { error: 'Failed to create realtime session' },
      { status: 500 }
    );
  }
}
