export interface SolanaProvider {
  connect: () => Promise<{ publicKey: { toString(): string } }>;
  disconnect?: () => Promise<void> | void;
  publicKey?: { toString(): string };
}

export function getSolanaProvider(): SolanaProvider | null {
  const w = window as unknown as Record<string, unknown>;
  const direct = w.solana as unknown;
  if (typeof direct === "object" && direct && "connect" in direct) {
    return direct as SolanaProvider;
  }
  for (const key of Object.keys(w)) {
    const value = w[key];
    if (typeof value !== "object" || !value) continue;
    const maybeSolana = (value as Record<string, unknown>).solana;
    if (
      typeof maybeSolana === "object" &&
      maybeSolana &&
      "connect" in maybeSolana
    ) {
      return maybeSolana as SolanaProvider;
    }
    if ("connect" in value && "publicKey" in value) {
      return value as SolanaProvider;
    }
  }
  return null;
}
