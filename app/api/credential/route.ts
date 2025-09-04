import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hash, filename } = body as { hash?: string; filename?: string };

    if (!hash) {
      return NextResponse.json({ error: "hash required" }, { status: 400 });
    }

    // If you already have a NestJS anchor endpoint, set it in .env as ANCHOR_ENDPOINT
    const endpoint = process.env.ANCHOR_ENDPOINT;

    if (endpoint) {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, filename }),
        cache: "no-store",
      });

      if (!r.ok) {
        const text = await r.text();
        return NextResponse.json({ error: "anchor failed", detail: text }, { status: 502 });
      }

      const data = await r.json();
      // Expect your backend to return at least { txHash?, blockNumber?, subscanUrl? }
      return NextResponse.json({
        ok: true,
        hash,
        filename: filename ?? null,
        anchored: true,
        receipt: data,
      });
    }

    // Fallback: no anchor endpoint yet — return a minimal receipt
    return NextResponse.json({
      ok: true,
      hash,
      filename: filename ?? null,
      anchored: false,
      receipt: { note: "No ANCHOR_ENDPOINT configured; returning local receipt only." },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}
