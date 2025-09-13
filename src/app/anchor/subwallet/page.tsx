"use client";

import { useState } from "react";
import { ApiPromise, WsProvider } from "@polkadot/api";
import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";
import {
  web3Enable,
  web3Accounts,
  web3FromSource,
} from "@polkadot/extension-dapp";

const WSS = "wss://westend-rpc.polkadot.io"; // Westend RPC

function isHex256(h: string) {
  return /^0x[0-9a-fA-F]{64}$/.test(h);
}

export default function AnchorWithSubWallet() {
  const [account, setAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState("");
  const [receipt, setReceipt] = useState<{
    txHash: string;
    blockHash: string;
    explorer: string;
  } | null>(null);
  const [error, setError] = useState("");

  async function connectWallet() {
    try {
      setError("");
      await web3Enable("W3b Stitch"); // request extension permission
      const accounts = await web3Accounts(); // all extension accounts
      if (!accounts.length)
        throw new Error("No accounts in SubWallet/Polkadot{.js}");
      setAccount(accounts[0]); // pick first or build a picker UI
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    }
  }

  async function anchor() {
    try {
      setError("");
      setReceipt(null);
      if (!account) throw new Error("Connect SubWallet first");
      if (!isHex256(hash)) throw new Error("Hash must be 0x + 64 hex chars");

      setStatus("Connecting RPC…");
      const api = await ApiPromise.create({ provider: new WsProvider(WSS) });

      // get signer from the same wallet source (SubWallet/Polkadot.js/etc.)
      const injector = await web3FromSource(account.meta.source);
      api.setSigner(injector.signer);

      // Build extrinsic; we’ll use system.remark to carry your hash
      const tx = api.tx.system.remark(hash);

      setStatus("Awaiting wallet approval…");
      const unsub = await tx.signAndSend(
        account.address,
        ({ status, txHash, dispatchError }) => {
          if (dispatchError) {
            unsub?.();
            setStatus("");
            setError(dispatchError.toString());
            return;
          }
          // DO NOT stop at isReady/isBroadcast; wait for inclusion
          if (status.isInBlock || status.isFinalized) {
            const blockHash = (
              status.isInBlock ? status.asInBlock : status.asFinalized
            ).toHex();
            const txHex = txHash.toHex();
            unsub?.();
            setStatus("");
            setReceipt({
              txHash: txHex,
              blockHash,
              explorer: `https://westend.subscan.io/extrinsic/${txHex}`,
            });
            api.disconnect().catch(() => {});
          }
        },
      );
    } catch (e: unknown) {
      setStatus("");
      const message = e instanceof Error ? e.message : String(e);
      setError(message);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h2>Anchor via SubWallet (Westend)</h2>

      {!account ? (
        <button onClick={connectWallet}>Connect SubWallet</button>
      ) : (
        <div>
          Connected: <code>{account.address}</code>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <input
          placeholder="0x…64 hex"
          value={hash}
          onChange={(e) => setHash(e.target.value.trim())}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={anchor} disabled={!account || !hash || !!status}>
          Anchor
        </button>
        {status && <span>⏳ {status}</span>}
      </div>

      {error && (
        <div style={{ color: "crimson", marginTop: 12 }}>❌ {error}</div>
      )}

      {receipt && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 8,
          }}
        >
          <div>✅ In block</div>
          <div>
            <b>Tx:</b> <code>{receipt.txHash}</code>
          </div>
          <div>
            <b>Block:</b> <code>{receipt.blockHash}</code>
          </div>
          <div style={{ marginTop: 8 }}>
            <a href={receipt.explorer} target="_blank" rel="noreferrer">
              Open in Subscan
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
