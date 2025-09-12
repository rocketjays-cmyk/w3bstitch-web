"use client";

import { useDid } from "./DidProvider";
import { useWallet } from "./WalletProvider";

function networkFromDid(did: string): string {
  const parts = did.split(":");
  if (parts[1] === "solana") {
    return "solana";
  }
  return parts[2] || "";
}

export default function ChainIndicator() {
  const { did, setDid } = useDid();
  const { disconnectSolana } = useWallet();
  if (!did) {
    return <span className="text-sm text-red-500">Not logged in</span>;
  }

  const network = networkFromDid(did);

  function logout() {
    disconnectSolana();
    setDid(null);
  }

  return (
    <span className="text-sm flex items-center gap-2">
      Connected: {network}
      <button onClick={logout} className="underline">
        Logout
      </button>
    </span>
  );
}
