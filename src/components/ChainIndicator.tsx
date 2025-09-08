"use client";

import { useEffect, useState } from "react";
import { chainFromDid } from "@/lib/did";

export default function ChainIndicator({ did }: { did: string }) {
  const [chain, setChain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const chainName = await chainFromDid(did);
        if (mounted) setChain(chainName);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [did]);

  if (error) {
    return <span className="text-sm text-red-500">Not connected</span>;
  }

  return (
    <span className="text-sm">
      {chain ? `Connected: ${chain}` : "Connecting..."}
    </span>
  );
}
