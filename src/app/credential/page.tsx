﻿"use client";

import React, { useEffect, useState } from "react";
import { fileToSha256Hex } from "../../../lib/hash";

interface AnchorReceipt {
  ok: boolean;
  txHash: string;
  explorer?: string;
}

export default function CredentialPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [qr, setQr] = useState<string>("");
  const [receipt, setReceipt] = useState<AnchorReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setQr("");
    setReceipt(null);
    setHash("");
    const f = e.target.files?.[0] ?? null;
    setFile(f || null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
    if (!f) return;
    const h = await fileToSha256Hex(f);
    setHash(h);
  }

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function toHexFromUtf8(s: string) {
    const bytes = new TextEncoder().encode(s);
    let hex = "0x";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return hex;
  }

  async function onAnchor() {
    if (!file || !hash) return;
    setLoading(true);
    setError("");
    setStatus("Connecting wallet…");
    try {
      const [
        { web3Enable, web3Accounts, web3FromAddress },
        { ApiPromise, WsProvider },
      ] = await Promise.all([
        import("@polkadot/extension-dapp"),
        import("@polkadot/api"),
      ]);

      await web3Enable("W3b Stitch");
      const accounts = await web3Accounts();
      if (!accounts.length)
        throw new Error("No Polkadot/SubWallet accounts found.");
      const address = accounts[0].address;

      setStatus("Connecting to chain…");
      const api = await ApiPromise.create({
        provider: new WsProvider("wss://westend-rpc.polkadot.io"),
      });
      const injector = await web3FromAddress(address);

      const payload = {
        v: "w3bstitch.anchor",
        alg: "sha256",
        hash,
        filename: file.name,
        ts: new Date().toISOString(),
      };
      const hexPayload = toHexFromUtf8(JSON.stringify(payload));
      const tx = api.tx.system.remarkWithEvent(hexPayload);

      setStatus("Awaiting wallet confirmation…");
      await new Promise<void>(async (resolve, reject) => {
        const unsub = await tx.signAndSend(
          address,
          { signer: injector.signer, nonce: -1 },
          async ({ status, dispatchError, txHash }) => {
            if (dispatchError) {
              unsub();
              reject(new Error(dispatchError.toString()));
              return;
            }
            if (status.isInBlock) {
              setStatus("Included in block");
              const txh = txHash.toHex();
              setReceipt({
                ok: true,
                txHash: txh,
                explorer: `https://westend.subscan.io/extrinsic/${txh}`,
              });

              const QRCode = (await import("qrcode")).default;
              const verifyUrl = `${window.location.origin}/verify?hash=${encodeURIComponent(hash)}`;
              const png = await QRCode.toDataURL(verifyUrl, {
                margin: 1,
                width: 280,
              });
              setQr(png);
            }
            if (status.isFinalized) {
              setStatus("Finalized");
              unsub();
              resolve();
            }
          },
        );
      });
      await api.disconnect();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Credential → QR Verification</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Upload credential (PDF/Image)
        </label>
        <input type="file" onChange={onSelect} className="block w-full" />
        {hash && (
          <p className="text-xs break-all">
            SHA-256: <span className="font-mono">{hash}</span>
          </p>
        )}
      </div>

      {preview && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Selected Image</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Selected file preview"
            className="border rounded-xl max-h-60"
          />
        </section>
      )}

      <button
        onClick={onAnchor}
        disabled={!file || !hash || loading}
        className="rounded-xl px-4 py-2 shadow border text-sm disabled:opacity-50"
      >
        {loading ? "Anchoring…" : "Anchor + Generate QR"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {status && !error && <p className="text-sm">{status}</p>}

      {qr && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">QR Code (scan to verify)</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt="Verification QR"
            className="border rounded-xl p-2"
          />
          <p className="text-sm">
            Or open:{" "}
            <a
              className="underline"
              href={`/verify?hash=${encodeURIComponent(hash)}`}
            >
              /verify?hash=…
            </a>
          </p>
        </section>
      )}

      {receipt && (
        <section className="space-y-2">
          <h3 className="font-semibold">Receipt</h3>
          <p className="text-xs break-all">
            Tx: <span className="font-mono">{receipt.txHash}</span>
            {receipt.explorer && (
              <>
                {" "}
                <a
                  href={receipt.explorer}
                  className="underline"
                  target="_blank"
                >
                  Explorer
                </a>
              </>
            )}
          </p>
          <pre className="text-xs bg-gray-100 p-3 rounded-xl overflow-auto">
            {JSON.stringify(receipt, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
