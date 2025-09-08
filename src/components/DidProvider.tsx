"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type DidContextValue = {
  did: string | null;
  setDid: (did: string | null) => void;
};

const DidContext = createContext<DidContextValue | undefined>(undefined);

export function DidProvider({ children }: { children: ReactNode }) {
  const [did, setDid] = useState<string | null>(null);
  return (
    <DidContext.Provider value={{ did, setDid }}>
      {children}
    </DidContext.Provider>
  );
}

export function useDid() {
  const ctx = useContext(DidContext);
  if (!ctx) throw new Error("useDid must be used within DidProvider");
  return ctx;
}
