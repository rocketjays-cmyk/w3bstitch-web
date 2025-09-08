// app/api/credential/route.ts
import { NextRequest, NextResponse } from "next/server";

type Ok = {
  ok: true;
  hash: string;
  filename: string | null;
  anchored: boolean;
  receipt: Record<string, unknown>;
};
type Err = { ok: false; error: string; detail?: string };
type AnchorResponse = Ok | Err;

export async function POST(
  req: NextRequest,
): Promise<NextResponse<AnchorResponse>> {
  try {
    const body = (await req.json()) as { hash?: unknown; filename?: unknown };
    const hash = typeof body.hash === "string" ? body.hash : "";
    const filename = typeof body.filename === "string" ? body.filename : "";

    if (!hash) {
      return NextResponse.json(
        { ok: false, error: "hash required" },
        { status: 400 },
      );
    }

    const endpoint =
      process.env.ANCHOR_ENDPOINT ?? new URL("/api/anchor", req.url).toString();

    const r = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hash, filename }),
      cache: "no-store",
    });

    const data = (await r.json()) as { ok?: boolean; error?: string } & Record<
      string,
      unknown
    >;
    if (!r.ok || !data.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: data.error || "anchor failed",
          detail: JSON.stringify(data),
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      hash,
      filename: filename || null,
      anchored: true,
      receipt: data,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
