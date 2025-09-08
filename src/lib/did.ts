import { ApiPromise, WsProvider } from "@polkadot/api";

const ENDPOINTS: Record<string, string> = {
  polkadot: "wss://rpc.polkadot.io",
  kusama: "wss://kusama-rpc.polkadot.io",
  westend: "wss://westend-rpc.polkadot.io",
};

export async function chainFromDid(did: string): Promise<string> {
  const match = did.match(/^did:polkadot:([^:]+)$/);
  if (!match) {
    throw new Error("Unsupported DID format");
  }
  const network = match[1];
  const endpoint = ENDPOINTS[network];
  if (!endpoint) {
    throw new Error(`Unsupported network: ${network}`);
  }

  const provider = new WsProvider(endpoint);
  const api = await ApiPromise.create({ provider });
  const chain = await api.rpc.system.chain();
  await api.disconnect();
  return chain.toString();
}
