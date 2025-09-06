// app/api/verify/route.ts
import { NextRequest, NextResponse } from "next/server";

type VerifyResponse = { ok: boolean; message: string };

export async function POST(req: NextRequest): Promise<NextResponse<VerifyResponse>> {
  try {
    const { payload } = (await req.json()) as { payload?: unknown };

    const text = typeof payload === "string" ? payload : "";
    if (!text) {
      return NextResponse.json({ ok: false, message: "Missing payload" }, { status: 400 });
    }

    // Mock check for now:
    if (text.length > 10) {
      return NextResponse.json({ ok: true, message: "Credential looks valid" });
    }
    return NextResponse.json({ ok: false, message: "Invalid credential" });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
