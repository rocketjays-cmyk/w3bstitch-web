"use client";

import { useEffect, useState } from "react";
import { useDid } from "@/components/DidProvider";
import { useWallet } from "@/components/WalletProvider";

type Chain = "westend" | "solana";

type ConnInfo = {
  chain?: string;
  nodeName?: string;
  version?: string;
  slot?: number;
};

export default function LoginPage() {
  const [chain, setChain] = useState<Chain>("westend");
  const [accounts, setAccounts] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [connInfo, setConnInfo] = useState<ConnInfo | null>(null);
  const { setDid } = useDid();
  const { connectSolana, disconnectSolana, solanaAddress } = useWallet();

  useEffect(() => {
    setAccounts(chain === "solana" && solanaAddress ? [solanaAddress] : []);
    setError(null);
    setConnInfo(null);
    setStatus("idle");
    if (chain !== "solana") {
      disconnectSolana();
    }
    setDid(null);
  }, [chain, setDid, solanaAddress, disconnectSolana]);

  const handleLogin = async () => {
    setStatus("loading");
    setError(null);
    setConnInfo(null);
    try {
      if (chain === "westend") {
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
      } else {
        const pubkey = await connectSolana();
        const { Connection } = await import("@solana/web3.js");
        const connection = new Connection("https://api.mainnet-beta.solana.com");
        const [slot, versionInfo] = await Promise.all([
          connection.getSlot(),
          connection.getVersion(),
        ]);
        setConnInfo({
          slot,
          version: versionInfo["solana-core"] ?? "",
        });
        setAccounts([pubkey]);
        setDid(`did:solana:${pubkey}`);
      }
      setStatus("idle");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  };

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Chain Picker Login</h1>

      <label className="text-lg font-semibold flex items-center gap-2">
        Select Chain
        <select
          className="px-3 py-1 rounded-lg border bg-transparent"
          value={chain}
          onChange={(e) => setChain(e.target.value as Chain)}
        >
          <option value="westend">Westend</option>
          <option value="solana">Solana</option>
        </select>
      </label>

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
          {chain === "westend" ? (
            <>
              <p>
                Chain: <b>{connInfo.chain}</b>
              </p>
              <p>Node: {connInfo.nodeName}</p>
              <p>Version: {connInfo.version}</p>
            </>
          ) : (
            <>
              <p>Slot: {connInfo.slot}</p>
              <p>Version: {connInfo.version}</p>
            </>
          )}
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
