"use client";

import React, { useState } from "react";
import QRCode from "qrcode";
import { fileToSha256Hex } from "@\/lib\/hash";

export default function CredentialPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [qr, setQr] = useState<string>("");
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    setQr("");
    setReceipt(null);
    setHash("");
    const f = e.target.files?.[0] ?? null;
    setFile(f || null);
    if (!f) return;
    const h = await fileToSha256Hex(f);
    setHash(h);
  }

  async function onAnchor() {
    if (!file || !hash) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, filename: file.name }),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok) {
        setError(data?.error ?? "Failed to anchor");
        setLoading(false);
        return;
      }
      setReceipt(data?.receipt ?? {});

      // Build a verify URL with the hash embedded
      const verifyUrl = `${window.location.origin}/verify?hash=${encodeURIComponent(hash)}`;
      const png = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 280 });
      setQr(png);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl p-6 space-y-6">
      <h1 className="text-2xl font-bold">Credential ? QR Verification</h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Upload credential (PDF/Image)</label>
        <input type="file" onChange={onSelect} className="block w-full" />
        {hash && (
          <p className="text-xs break-all">
            SHA-256: <span className="font-mono">{hash}</span>
          </p>
        )}
      </div>

      <button
        onClick={onAnchor}
        disabled={!file || !hash || loading}
        className="rounded-xl px-4 py-2 shadow border text-sm disabled:opacity-50"
      >
        {loading ? "Anchoring…" : "Anchor + Generate QR"}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {qr && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">QR Code (scan to verify)</h2>
          <img src={qr} alt="Verification QR" className="border rounded-xl p-2" />
          <p className="text-sm">
            Or open: <a className="underline" href={`/verify?hash=${encodeURIComponent(hash)}`}>/verify?hash=…</a>
          </p>
        </section>
      )}

      {receipt && (
        <section className="space-y-2">
          <h3 className="font-semibold">Receipt</h3>
          <pre className="text-xs bg-gray-100 p-3 rounded-xl overflow-auto">
{JSON.stringify(receipt, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
