"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SolflareWallet {
  isSolflare?: boolean;
  connect: (args?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } } | void>;
  disconnect?: () => Promise<void> | void;
  publicKey?: { toString(): string };
}

interface SolflareWindow extends Window {
  solflare?: SolflareWallet;
  solana?: SolflareWallet;
}

type WalletContextValue = {
  solanaAddress: string | null;
  connectSolana: () => Promise<string>;
  disconnectSolana: () => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [solanaAddress, setSolanaAddress] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("solanaAddress");
    }
    return null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!solanaAddress) return;
    const provider =
      (window as SolflareWindow).solflare ?? (window as SolflareWindow).solana;
    if (!provider) {
      setSolanaAddress(null);
      sessionStorage.removeItem("solanaAddress");
      return;
    }
    provider.connect({ onlyIfTrusted: true }).catch(() => {
      setSolanaAddress(null);
      sessionStorage.removeItem("solanaAddress");
    });
  }, []);

  async function connectSolana() {
    const provider =
      (window as SolflareWindow).solflare ?? (window as SolflareWindow).solana;
    if (!provider) throw new Error("No Solflare wallet found");
    await provider.connect();
    const pubkey = provider.publicKey?.toString();
    if (!pubkey) throw new Error("Failed to retrieve public key");
    setSolanaAddress(pubkey);
    sessionStorage.setItem("solanaAddress", pubkey);
    return pubkey;
  }

  function disconnectSolana() {
    const provider =
      (window as SolflareWindow).solflare ?? (window as SolflareWindow).solana;
    try {
      provider?.disconnect?.();
    } catch {
      /* ignore */
    }
    setSolanaAddress(null);
    sessionStorage.removeItem("solanaAddress");
  }

  return (
    <WalletContext.Provider
      value={{ solanaAddress, connectSolana, disconnectSolana }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

