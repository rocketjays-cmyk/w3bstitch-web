"use client";

import { useEffect, useState } from "react";

export default function PolkadotConnectivity() {
  const [status, setStatus] = useState<"idle" | "connecting" | "ok" | "error">("idle");
  const [info, setInfo] = useState<{
    chain?: string;
    nodeName?: string;
    version?: string;
    endpoint: string;
    error?: string;
  }>({
    endpoint: "wss://westend-rpc.polkadot.io",
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
      } catch (e) {
        if (!mounted) return;
        setInfo((p) => ({ ...p, error: e instanceof Error ? e.message : String(e) }));
        setStatus("error");
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Polkadot Connectivity (Westend)</h1>
      <p className="text-sm text-gray-400">
        Endpoint: <code>{info.endpoint}</code>
      </p>

      {status === "connecting" && <p>Connecting…</p>}

      {status === "ok" && (
        <ul className="text-sm space-y-1">
          <li>
            Chain: <b>{info.chain}</b>
          </li>
          <li>Node: {info.nodeName}</li>
          <li>Version: {info.version}</li>
        </ul>
      )}

      {status === "error" && <p className="text-red-500 text-sm">Failed: {info.error}</p>}
    </main>
  );
}
