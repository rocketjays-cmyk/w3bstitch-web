"use client";

import { useState } from "react";

export default function LoginPage() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setStatus("loading");
    setError(null);
    try {
      const { web3Enable, web3Accounts } = await import(
        "@polkadot/extension-dapp"
      );
      const extensions = await web3Enable("W3b Stitch");
      if (extensions.length === 0) {
        throw new Error("No wallet extensions found");
      }
      const allAccounts = await web3Accounts();
      setAccounts(allAccounts.map((a) => a.address));
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Decentralized Identity Login</h1>
      <button
        onClick={handleLogin}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Connecting..." : "Login with Polkadot"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {accounts.length > 0 && (
        <ul className="text-sm space-y-1">
          {accounts.map((a) => (
            <li key={a} className="break-all">
              {a}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
