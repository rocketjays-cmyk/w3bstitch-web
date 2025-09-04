import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hash = (body && body.hash) ? String(body.hash) : "";
    const filename = (body && body.filename) ? String(body.filename) : "";

    if (!hash) {
      return NextResponse.json({ ok: false, error: "hash required" }, { status: 400 });
    }

    const endpoint = process.env.ANCHOR_ENDPOINT;
    if (endpoint) {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, filename }),
        cache: "no-store"
      });

      if (!r.ok) {
        const detail = await r.text();
        return NextResponse.json({ ok: false, error: "anchor failed", detail }, { status: 502 });
      }

      const data = await r.json();
      return NextResponse.json({
        ok: true,
        hash,
        filename: filename || null,
        anchored: true,
        receipt: data
      });
    }

    // Fallback when no backend is configured
    return NextResponse.json({
      ok: true,
      hash,
      filename: filename || null,
      anchored: false,
      receipt: { note: "No ANCHOR_ENDPOINT configured; returning local receipt only." }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e && e.message ? e.message : "unknown error" }, { status: 500 });
  }
}
