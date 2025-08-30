import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { payload } = await req.json();

  // MOCK RULES (replace later with real checks):
  // - if payload length > 8, pretend it verifies
  const ok = typeof payload === 'string' && payload.trim().length > 8;

  return NextResponse.json({
    ok,
    message: ok
      ? 'Mock verification passed (placeholder logic).'
      : 'Mock verification failed (placeholder logic).',
  });
}
