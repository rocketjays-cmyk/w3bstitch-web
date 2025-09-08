import { NextRequest } from "next/server";

type StoredReceipt = {
  txHash: string;
  did: string;
  hash: string;
  filename: string;
  timestamp: string;
};

const receipts = new Map<string, StoredReceipt>();

export async function POST(req: NextRequest) {
  const data = (await req.json()) as Partial<StoredReceipt>;
  if (!data.txHash || !data.did || !data.hash || !data.filename) {
    return new Response(JSON.stringify({ ok: false, error: "missing fields" }), {
      status: 400,
    });
  }
  const receipt: StoredReceipt = {
    txHash: data.txHash,
    did: data.did,
    hash: data.hash,
    filename: data.filename,
    timestamp: new Date().toISOString(),
  };
  receipts.set(receipt.txHash, receipt);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txHash = searchParams.get("txHash");
  if (!txHash || !receipts.has(txHash)) {
    return new Response(JSON.stringify({ ok: false, error: "not found" }), {
      status: 404,
    });
  }
  return new Response(
    JSON.stringify({ ok: true, receipt: receipts.get(txHash) }),
    { status: 200 },
  );
}
