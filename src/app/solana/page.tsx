"use client";

import { useEffect, useState } from "react";

export default function SolanaConnectivity() {
  const [status, setStatus] = useState<"idle" | "connecting" | "ok" | "error">("idle");
  const [info, setInfo] = useState<{
    endpoint: string;
    slot?: number;
    version?: string;
    error?: string;
  }>({
    endpoint: "https://api.devnet.solana.com",
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setStatus("connecting");
      try {
        const { Connection } = await import("@solana/web3.js");
        const connection = new Connection(info.endpoint);
        const [slot, version] = await Promise.all([
          connection.getSlot(),
          connection.getVersion(),
        ]);
        if (!mounted) return;
        setInfo((p) => ({
          ...p,
          slot,
          version: version["solana-core"],
        }));
        setStatus("ok");
      } catch (e) {
        if (!mounted) return;
        setInfo((p) => ({
          ...p,
          error: e instanceof Error ? e.message : String(e),
        }));
        setStatus("error");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [info.endpoint]);

  return (
    <main className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Solana Connectivity (Devnet)</h1>
      <p className="text-sm text-gray-400">
        Endpoint: <code>{info.endpoint}</code>
      </p>

      {status === "connecting" && <p>Connecting…</p>}

      {status === "ok" && (
        <ul className="text-sm space-y-1">
          <li>Slot: {info.slot}</li>
          <li>Version: {info.version}</li>
        </ul>
      )}

      {status === "error" && (
        <p className="text-red-500 text-sm">Failed: {info.error}</p>
      )}
    </main>
  );
}
