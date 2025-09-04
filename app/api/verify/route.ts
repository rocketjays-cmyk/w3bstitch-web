// app/api/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { payload } = await req.json();

    if (!payload) {
      return NextResponse.json(
        { ok: false, message: 'Missing payload' },
        { status: 400 }
      );
    }

    // For now, fake validation — just check length
    if (typeof payload === 'string' && payload.length > 10) {
      return NextResponse.json({ ok: true, message: 'Credential looks valid' });
    }

    return NextResponse.json({ ok: false, message: 'Invalid credential' });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
