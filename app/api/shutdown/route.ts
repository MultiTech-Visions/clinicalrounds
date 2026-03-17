import { NextResponse } from 'next/server';

// POST /api/shutdown — gracefully stop the server process
export async function POST() {
  // Send response before exiting so the client gets confirmation
  const response = NextResponse.json({ ok: true });

  // Schedule exit after response is sent
  setTimeout(() => {
    process.exit(0);
  }, 500);

  return response;
}
