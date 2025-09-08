// app or src/app /api/anchor/route.ts
import { NextRequest } from 'next/server';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';

export const runtime = 'nodejs'; // needed for WS in serverless

export async function POST(req: NextRequest) {
  try {
    const { hash } = (await req.json()) as { hash?: unknown };
    const raw = typeof hash === 'string' ? hash : '';
    const cleaned = raw.startsWith('0x') ? raw.slice(2) : raw;
    if (!/^[0-9a-fA-F]{64}$/.test(cleaned)) {
      return new Response(
        JSON.stringify({ error: 'Invalid hash, must be 64 hex chars' }),
        { status: 400 }
      );
    }
    const fullHash = `0x${cleaned}`;

    const provider = new WsProvider(
      process.env.WESTEND_WSS || 'wss://westend-rpc.polkadot.io'
    );
    const api = await ApiPromise.create({ provider });

    const keyring = new Keyring({ type: 'sr25519' });
    const signer = keyring.addFromUri(
      process.env.ANCHOR_SIGNER_URI || '//Alice'
    );

    const tx = api.tx.system.remarkWithEvent(fullHash);

    return new Promise<Response>(async (resolve, reject) => {
      try {
        const unsub = await tx.signAndSend(
          signer,
          ({ status, txHash, dispatchError }) => {
            if (dispatchError) {
              unsub?.();
              reject(
                new Response(
                  JSON.stringify({ error: dispatchError.toString() }),
                  { status: 500 }
                )
              );
            }
            if (status.isInBlock || status.isFinalized) {
              unsub?.();
              resolve(
                new Response(
                  JSON.stringify({
                    ok: true,
                    txHash: txHash.toHex(),
                    explorer: `https://westend.subscan.io/extrinsic/${txHash.toHex()}`,
                  }),
                  { status: 200, headers: { 'content-type': 'application/json' } }
                )
              );
            }
          }
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        reject(
          new Response(JSON.stringify({ error: message }), { status: 500 })
        );
      }
    }).finally(async () => {
      await api.disconnect();
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
