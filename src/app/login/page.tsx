"use client";

import { useEffect, useState } from "react";

interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toString(): string } }>;
}

type ConnInfo = {
  chain?: string;
  nodeName?: string;
  version?: string;
  slot?: number;
  error?: string;
};

export default function LoginPage() {
  const [chain, setChain] = useState<"westend" | "solana">("westend");
  const [connStatus, setConnStatus] = useState<
    "idle" | "connecting" | "ok" | "error"
  >("idle");
  const [connInfo, setConnInfo] = useState<ConnInfo>({});

  const [accounts, setAccounts] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setConnStatus("connecting");
      try {
        if (chain === "westend") {
          const { ApiPromise, WsProvider } = await import("@polkadot/api");
          const provider = new WsProvider("wss://westend-rpc.polkadot.io");
          const api = await ApiPromise.create({ provider });
          const [chainName, nodeName, version] = await Promise.all([
            api.rpc.system.chain(),
            api.rpc.system.name(),
            api.rpc.system.version(),
          ]);
          if (!mounted) return;
          setConnInfo({
            chain: chainName.toString(),
            nodeName: nodeName.toString(),
            version: version.toString(),
          });
          await api.disconnect();
        } else {
          const { Connection } = await import("@solana/web3.js");
          const connection = new Connection("https://api.devnet.solana.com");
          const [slot, version] = await Promise.all([
            connection.getSlot(),
            connection.getVersion(),
          ]);
          if (!mounted) return;
          setConnInfo({
            slot,
            version: version["solana-core"],
          });
        }
        if (mounted) setConnStatus("ok");
      } catch (e) {
        if (!mounted) return;
        setConnInfo({ error: e instanceof Error ? e.message : String(e) });
        setConnStatus("error");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [chain]);

  const handleLogin = async () => {
    setStatus("loading");
    setError(null);
    try {
      if (chain === "westend") {
        const { web3Enable, web3Accounts } = await import(
          "@polkadot/extension-dapp"
        );
        const extensions = await web3Enable("W3b Stitch");
        if (extensions.length === 0) {
          throw new Error("No wallet extensions found");
        }
        const allAccounts = await web3Accounts();
        setAccounts(allAccounts.map((a) => a.address));
      } else {
        const provider = (
          window as unknown as { solana?: SolanaProvider }
        ).solana;
        if (!provider) {
          throw new Error("No Solana wallet found");
        }
        const resp = await provider.connect();
        setAccounts([resp.publicKey.toString()]);
      }
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Decentralized Identity Login</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Choose Your Chain</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setChain("westend")}
            className={`px-3 py-1 rounded-lg border ${
              chain === "westend"
                ? "bg-indigo-600 text-white"
                : "bg-transparent text-indigo-600 border-indigo-600"
            }`}
          >
            Westend
          </button>
          <button
            onClick={() => setChain("solana")}
            className={`px-3 py-1 rounded-lg border ${
              chain === "solana"
                ? "bg-violet-600 text-white"
                : "bg-transparent text-violet-600 border-violet-600"
            }`}
          >
            Solana
          </button>
        </div>

        <div className="text-sm text-gray-400">
          {connStatus === "connecting" && <p>Connecting…</p>}

          {connStatus === "ok" && chain === "westend" && (
            <ul className="space-y-1">
              <li>
                Chain: <b>{connInfo.chain}</b>
              </li>
              <li>Node: {connInfo.nodeName}</li>
              <li>Version: {connInfo.version}</li>
            </ul>
          )}

          {connStatus === "ok" && chain === "solana" && (
            <ul className="space-y-1">
              <li>Slot: {connInfo.slot}</li>
              <li>Version: {connInfo.version}</li>
            </ul>
          )}

          {connStatus === "error" && (
            <p className="text-red-500">Failed: {connInfo.error}</p>
          )}
        </div>
      </section>

      <button
        onClick={handleLogin}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition"
        disabled={status === "loading"}
      >
        {status === "loading"
          ? "Connecting..."
          : `Login with ${chain === "westend" ? "Polkadot" : "Solana"}`}
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
