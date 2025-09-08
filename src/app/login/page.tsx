"use client";

import { useEffect, useState } from "react";
import { useDid } from "@/components/DidProvider";

type ConnInfo = {
  chain?: string;
  nodeName?: string;
  version?: string;
};

export default function LoginPage() {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [connInfo, setConnInfo] = useState<ConnInfo | null>(null);
  const { setDid } = useDid();

  useEffect(() => {
    setAccounts([]);
    setError(null);
    setConnInfo(null);
    setStatus("idle");
    setDid(null);
  }, [setDid]);

  const handleLogin = async () => {
    setStatus("loading");
    setError(null);
    setConnInfo(null);
    try {
      const { ApiPromise, WsProvider } = await import("@polkadot/api");
      const { web3Enable, web3Accounts } = await import(
        "@polkadot/extension-dapp"
      );
      const provider = new WsProvider("wss://westend-rpc.polkadot.io");
      const api = await ApiPromise.create({ provider });

      const [chainName, nodeName, version] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version(),
      ]);

      const extensions = await web3Enable("W3b Stitch");
      if (extensions.length === 0) {
        throw new Error("No wallet extensions found");
      }
      const allAccounts = await web3Accounts();

      const addresses = allAccounts.map((a) => a.address);
      setConnInfo({
        chain: chainName.toString(),
        nodeName: nodeName.toString(),
        version: version.toString(),
      });
      setAccounts(addresses);
      setDid(`did:polkadot:westend:${addresses[0]}`);
      await api.disconnect();
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Login</h1>

      <button
        onClick={handleLogin}
        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Connecting..." : "Connect"}
      </button>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {connInfo && (
        <div className="text-sm text-gray-400 space-y-1">
          <p>
            Chain: <b>{connInfo.chain}</b>
          </p>
          <p>Node: {connInfo.nodeName}</p>
          <p>Version: {connInfo.version}</p>
        </div>
      )}

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
