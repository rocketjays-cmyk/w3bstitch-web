"use client";

import { useState } from "react";

export default function SolanaPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  interface SolflareWallet {
    isSolflare?: boolean;
    connect: () => Promise<{ publicKey: { toString(): string } } | void>;
    publicKey?: { toString(): string };
  }

  interface SolflareWindow extends Window {
    solflare?: SolflareWallet;
    solana?: SolflareWallet;
  }

  async function connect() {
    try {
      setError("");
      const provider =
        (window as SolflareWindow).solflare ??
        (window as SolflareWindow).solana;
      if (!provider || !provider.isSolflare) {
        setError("No Solflare wallet found.");
        return;
      }
      const resp = await provider.connect();
      const pubkey = (resp?.publicKey || provider.publicKey)?.toString();
      setAddress(pubkey);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Solana Connectivity</h1>
      <button
        onClick={connect}
        disabled={!!address}
        className="rounded-xl px-4 py-2 shadow border text-sm disabled:opacity-50"
      >
        {address ? `Connected: ${address.slice(0, 4)}…${address.slice(-4)}` : "Connect Solflare"}
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </main>
  );
}
