"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function WalletDemo() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const fetchBalance = async () => {
    try {
      if (!publicKey) {
        console.error("Wallet not connected");
        return;
      }
      const lamports = await connection.getBalance(publicKey);
      console.log(`Wallet balance: ${lamports / LAMPORTS_PER_SOL} SOL`);
    } catch (err) {
      console.error("Failed to fetch balance", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <WalletMultiButton />
      <button
        type="button"
        onClick={fetchBalance}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        Fetch Balance
      </button>
    </div>
  );
}

