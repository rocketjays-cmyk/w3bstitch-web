import PolkadotInfo from './PolkadotInfo';

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-6">W3b Stitch — DOT Connectivity</h1>
      <PolkadotInfo />
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";

export default function PolkadotConnectivity() {
  const [status, setStatus] = useState<"idle"|"connecting"|"ok"|"error">("idle");
  const [info, setInfo] = useState<{ chain?: string; version?: string; nodeName?: string; endpoint: string; error?: string }>({
    endpoint: "wss://westend-rpc.polkadot.io"
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setStatus("connecting");
      try {
        const { ApiPromise, WsProvider } = await import("@polkadot/api");
        const provider = new WsProvider(info.endpoint);
        const api = await ApiPromise.create({ provider });

        const [chain, nodeName, version] = await Promise.all([
          api.rpc.system.chain(),
          api.rpc.system.name(),
          api.rpc.system.version(),
        ]);

        if (!mounted) return;
        setInfo((p) => ({
          ...p,
          chain: chain.toString(),
          nodeName: nodeName.toString(),
          version: version.toString(),
        }));
        setStatus("ok");
        await api.disconnect();
      } catch (e: any) {
        if (!mounted) return;
        setInfo((p) => ({ ...p, error: e?.message || String(e) }));
        setStatus("error");
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Polkadot Connectivity (Westend)</h1>
      <p className="text-sm text-gray-400">Endpoint: <code>{info.endpoint}</code></p>

      {status === "connecting" && <p>Connecting…</p>}
      {status === "ok" && (
        <ul className="text-sm space-y-1">
          <li>Chain: <b>{info.chain}</b></li>
          <li>Node: {info.nodeName}</li>
          <li>Version: {info.version}</li>
        </ul>
      )}
      {status === "error" && (
        <p className="text-red-500 text-sm">Failed: {info.error}</p>
      )}
    </main>
  );
}
"use client";

import React, { useState } from "react";
import { fileToSha256Hex } from "../../lib/hash";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

async function anchorViaExtension(hash: string): Promise<{ txHash: string; explorer: string }> {
  const { ApiPromise, WsProvider } = await import("@polkadot/api");
  const { web3Enable, web3Accounts, web3FromSource } = await import("@polkadot/extension-dapp");

  await web3Enable("W3b Stitch");
  const accounts = (await web3Accounts()) as InjectedAccountWithMeta[];
  if (!accounts.length) throw new Error("No extension account found");

  const account = accounts[0];
  const injector = await web3FromSource(account.meta.source);

  const api = await ApiPromise.create({ provider: new WsProvider("wss://westend-rpc.polkadot.io") });
  api.setSigner(injector.signer);

  const tx = api.tx.system.remarkWithEvent(hash);

  return new Promise<{ txHash: string; explorer: string }>((resolve, reject) => {
    tx.signAndSend(account.address, ({ status, dispatchError, txHash }) => {
      if (dispatchError) {
        reject(new Error(dispatchError.toString()));
      } else if (status.isInBlock || status.isFinalized) {
        resolve({
          txHash: txHash.toString(),
          explorer: `https://westend.subscan.io/extrinsic/${txHash.toString()}`
        });
      }
    }).catch(reject);
  }).finally(() => api.disconnect());
}

export default function CredentialPage() {
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>("");
  const [qr, setQr] = useState<string>("");
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError(""); setQr(""); setReceipt(null); setHash("");
    const f = e.target.files?.[0] ?? null;
    setFile(f || null);
    if (!f) return;
    const h = await fileToSha256Hex(f);
    setHash(h);
  }

  async function onAnchorApi() {
    if (!file || !hash) return;
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, filename: file.name }),
      });
      const data = (await r.json()) as { ok?: boolean; receipt?: Record<string, unknown>; error?: string };
      if (!r.ok || !data?.ok) throw new Error(data?.error ?? "Failed to anchor (API)");
      setReceipt(data.receipt ?? {});

      const { toDataURL } = await import("qrcode");
      const verifyUrl = `${window.location.origin}/verify?hash=${encodeURIComponent(hash)}`;
      const png = await toDataURL(verifyUrl, { margin: 1, width: 280 });
      setQr(png);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onAnchorExtension() {
    if (!hash) { setError("No hash to anchor. Upload a file first."); return; }
    setLoading(true); setError("");
    try {
      const res = await anchorViaExtension(hash);
      // tack the explorer link onto receipt so you can see it
      setReceipt({ ...(receipt ?? {}), extensionAnchor: res });
      alert(`Anchored on Westend!\n${res.explorer}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String
