'use client';

import { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';

export default function PolkadotInfo() {
  const [chain, setChain] = useState<string>('connecting...');
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    let api: ApiPromise | null = null;
    const run = async () => {
      try {
        const wss = process.env.NEXT_PUBLIC_DOT_WSS || 'wss://rpc.polkadot.io';
        const provider = new WsProvider(wss);
        api = await ApiPromise.create({ provider });
        const [chainName, nodeVersion] = await Promise.all([
          api.rpc.system.chain(),
          api.rpc.system.version(),
        ]);
        setChain(chainName.toString());
        setVersion(nodeVersion.toString());
      } catch (e) {
        setChain('error');
        console.error(e);
      }
    };
    run();
    return () => {
      api?.disconnect().catch(() => {});
    };
  }, []);

  return (
    <div className="p-6 rounded-2xl border">
      <h2 className="text-xl font-semibold mb-2">Polkadot Node</h2>
      <p>Chain: <b>{chain}</b></p>
      <p>Version: <b>{version}</b></p>
    </div>
  );
}
