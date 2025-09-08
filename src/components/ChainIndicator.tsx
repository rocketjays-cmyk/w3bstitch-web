"use client";

import { useEffect, useState } from "react";

export default function ChainIndicator() {
  const [chain, setChain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { ApiPromise, WsProvider } = await import("@polkadot/api");
        const provider = new WsProvider("wss://westend-rpc.polkadot.io");
        const api = await ApiPromise.create({ provider });
        const chainName = await api.rpc.system.chain();
        if (mounted) setChain(chainName.toString());
        await api.disconnect();
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return <span className="text-sm text-red-500">Not connected</span>;
  }

  return (
    <span className="text-sm">{chain ? `Connected: ${chain}` : "Connecting..."}</span>
  );
}
