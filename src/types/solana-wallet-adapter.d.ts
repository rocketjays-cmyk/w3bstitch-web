declare module '@solana/wallet-adapter-react' {
  import type { FC, ReactNode } from 'react';
  export const ConnectionProvider: FC<{ endpoint: string; children: ReactNode }>;
  export const WalletProvider: FC<{ wallets: any[]; children: ReactNode; autoConnect?: boolean }>;
}

declare module '@solana/wallet-adapter-solflare' {
  export class SolflareWalletAdapter {
    constructor(config?: any);
  }
}
