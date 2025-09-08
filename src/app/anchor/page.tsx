"use client";

import React, { useMemo, useRef, useState } from "react";
import type { DispatchError } from "@polkadot/types/interfaces";
import type { AccountInfo } from "@polkadot/types/interfaces/system";
import type { SubmittableResult } from "@polkadot/api";

/**
 * W3b Stitch — Anchor Media (Westend / Polkadot)
 * - Client-only (safe for Vercel)
 * - Dynamic imports for chain libs
 * - Robust tx flow: Broadcast → InBlock → Finalized (nonce:-1)
 * - Receipt download (JSON)
 */

export default function AnchorPage() {
  const [network, setNetwork] = useState<"westend" | "polkadot">("westend");
  const [url, setUrl] = useState("");
  const [wallet, setWallet] = useState<{ address: string } | null>(null);
  const [hashHex, setHashHex] = useState("");
  const [bytes, setBytes] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [extrinsicHash, setExtrinsicHash] = useState("");
  const [finalizedBlock, setFinalizedBlock] = useState("");
  const [anchorDate, setAnchorDate] = useState("");
  const [chainPayload, setChainPayload] = useState<unknown>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const wsEndpoint = useMemo(
    () => (network === "westend" ? "wss://westend-rpc.polkadot.io" : "wss://rpc.polkadot.io"),
    [network]
  );

  // ---------- utils ----------
  function toHexFromUtf8(s: string) {
    const bytes = new TextEncoder().encode(s);
    let hex = "0x";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return hex;
  }

  function hexToString(hex: string) {
    const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
    const bytes = new Uint8Array(
      clean.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) || []
    );
    return new TextDecoder().decode(bytes);
  }

  async function sha256ArrayBuffer(buf: ArrayBuffer) {
    const h = await crypto.subtle.digest("SHA-256", buf);
    const arr = new Uint8Array(h);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function short(addr: string) {
    return addr.slice(0, 6) + "…" + addr.slice(-6);
  }

  // ---------- hashing ----------
  async function hashFromUrl(u: string) {
    setStatus("Downloading media…");
    const res = await fetch(u, { mode: "cors" });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    const buf = await res.arrayBuffer();
    setBytes(buf.byteLength);
    setStatus("Computing SHA-256…");
    const hex = await sha256ArrayBuffer(buf);
    setHashHex(hex);
    setStatus("Hash ready.");
  }

  async function hashFromFile(f: File) {
    const buf = await f.arrayBuffer();
    setBytes(buf.byteLength);
    setStatus("Computing SHA-256…");
    const hex = await sha256ArrayBuffer(buf);
    setHashHex(hex);
    setStatus("Hash ready.");
  }

  // ---------- wallet ----------
  async function connectWallet() {
    setStatus("Connecting wallet…");
    const { web3Enable, web3Accounts } = await import("@polkadot/extension-dapp");
    await web3Enable("W3b Stitch");
    const accounts = await web3Accounts();
    if (!accounts.length) throw new Error("No Polkadot/SubWallet accounts found.");
    setWallet({ address: accounts[0].address });
    setStatus(`Wallet connected: ${short(accounts[0].address)}`);
  }

  // ---------- anchor ----------
  async function doAnchor() {
    try {
      if (!hashHex) throw new Error("No hash to anchor.");
      if (!wallet) throw new Error("Connect wallet first.");
      setAnchorDate("");
      setChainPayload(null);
      setStatus("Connecting to chain…");
      const [{ ApiPromise, WsProvider }, { web3FromAddress }] = await Promise.all([
        import("@polkadot/api"),
        import("@polkadot/extension-dapp"),
      ]);

      // Use a full RPC (avoid light://)
      const provider = new WsProvider(wsEndpoint);
      const api = await ApiPromise.create({ provider });

      // Health + balance checks
      const [health, accountInfoRaw] = await Promise.all([
        api.rpc.system.health(),
        api.query.system.account(wallet.address),
      ]);
      if (!health.isSyncing.isFalse) {
        setStatus("RPC is syncing; try again in a minute or switch RPC.");
        return;
      }

      const accountInfo = accountInfoRaw as unknown as AccountInfo;
      const free = BigInt(accountInfo.data.free.toString());
      const MIN = BigInt(1_000_000_000); // ~0.01 WND
      if (network === "westend" && free < MIN) {
        setStatus(`Not enough WND to pay fees. Free balance: ${free.toString()}`);
        return;
      }

      const injector = await web3FromAddress(wallet.address);

      const payload = {
        v: "w3bstitch.anchor",
        alg: "sha256",
        hash: hashHex,
        url: url || "(local file)",
        ts: new Date().toISOString(),
      };
      const hexPayload = toHexFromUtf8(JSON.stringify(payload));

      const tx = api.tx.system.remarkWithEvent(hexPayload);
      setExtrinsicHash(tx.hash.toHex());

      setStatus("Submitting transaction… (broadcasting)");
      const unsub = await tx.signAndSend(
        wallet.address,
        { signer: injector.signer, nonce: -1 },
        ({ status, dispatchError, events }: SubmittableResult) => {
          if (dispatchError) {
            const err = dispatchError as DispatchError;
            if (err.isModule) {
              const decoded = api.registry.findMetaError(err.asModule);
              setStatus(`On-chain error: ${decoded.section}.${decoded.name} — ${decoded.docs.join(" ")}`);
            } else {
              setStatus(`On-chain error: ${err.toString()}`);
            }
            unsub();
            return;
          }

          if (status.isBroadcast) setStatus("📡 Broadcasted… waiting for inclusion");
          if (status.isInBlock) setStatus(`✅ Included in block: ${status.asInBlock.toString()}`);
          if (status.isFinalized) {
            const blockHash = status.asFinalized.toString();
            setFinalizedBlock(blockHash);

            const failed = events.some(
              (e) => e.event.section === "system" && e.event.method === "ExtrinsicFailed"
            );
            setStatus(
              failed
                ? "❌ Included but failed — see Subscan for details."
                : `🎉 Finalized in block ${blockHash}`
            );

            (async () => {
              try {
                const [block, ts] = await Promise.all([
                  api.rpc.chain.getBlock(blockHash),
                  api.query.timestamp.now.at(blockHash),
                ]);
                const idx = block.block.extrinsics.findIndex(
                  (ex) => ex.hash.toHex() === tx.hash.toHex()
                );
                if (idx !== -1) {
                  const remark = events.find(
                    (e) =>
                      e.phase.isApplyExtrinsic &&
                      e.phase.asApplyExtrinsic.eq(idx) &&
                      e.event.section === "system" &&
                      e.event.method === "Remarked"
                  );
                  if (remark) {
                    const hex = remark.event.data[1].toString();
                    const text = hexToString(hex);
                    try {
                      setChainPayload(JSON.parse(text));
                    } catch {
                      setChainPayload(text);
                    }
                  }
                }
                setAnchorDate(new Date(Number(ts.toString())).toISOString());
              } catch (err) {
                console.error("Failed to fetch chain data", err);
              }
            })();

            unsub();
          }
        }
      );

      // Fallback notice if nothing includes
      setTimeout(() => {
        // use a fresh read of state
        setStatus((prev) =>
          !prev.includes("Finalized") && !prev.includes("Included")
            ? "Still waiting for inclusion… try again or switch RPC."
            : prev
        );
      }, 90_000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus(`Failed: ${msg}`);
    }
  }

  // ---------- receipt ----------
  function downloadReceipt() {
    if (!extrinsicHash || !wallet) return;
    const receipt = {
      type: "w3bstitch.tdr",
      chain: network,
      extrinsicHash,
      finalizedBlock: finalizedBlock || "(pending)",
      account: wallet.address,
      payload: {
        v: "w3bstitch.anchor",
        alg: "sha256",
        hash: hashHex,
        url: url || "(local file)",
        ts: new Date().toISOString(),
      },
    };
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `tdr-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(href);
  }

  // ---------- UI ----------
  const subscanBase =
    network === "westend"
      ? "https://westend.subscan.io/extrinsic/"
      : "https://polkadot.subscan.io/extrinsic/";

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>W3b Stitch — Anchor Media to Polkadot</h1>
      <p>
        Hash a file or URL, then anchor via <code>system.remarkWithEvent</code>.
      </p>

      <label style={{ display: "block", marginBottom: 8 }}>
        Network:&nbsp;
        <select value={network} onChange={(e) => setNetwork(e.target.value as "westend" | "polkadot")}>
          <option value="westend">Westend (testnet)</option>
          <option value="polkadot">Polkadot (mainnet)</option>
        </select>
      </label>

      <div style={{ display: "grid", gap: 8, margin: "12px 0" }}>
        <input
          type="url"
          placeholder="https://example.com/media.jpg (optional if you choose a file)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ padding: 8 }}
        />
        <div>
          <input
            ref={fileRef}
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) hashFromFile(f).catch((err) => setStatus(err.message));
            }}
          />
          <button
            onClick={() =>
              url ? hashFromUrl(url).catch((e) => setStatus(e.message)) : setStatus("Enter a URL or pick a file first")
            }
          >
            Hash URL
          </button>
        </div>
      </div>

      <div style={{ margin: "8px 0" }}>
        <button onClick={connectWallet} disabled={!!wallet}>
          Connect Wallet
        </button>
        <button onClick={doAnchor} disabled={!wallet || !hashHex} style={{ marginLeft: 8 }}>
          Anchor to Chain
        </button>
      </div>

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <p><b>Status:</b> {status || "—"}</p>
        <p><b>Bytes:</b> {bytes ?? "—"}</p>
        <p><b>SHA-256:</b> {hashHex || "—"}</p>
        <p><b>Extrinsic Hash:</b> {extrinsicHash || "—"}</p>
        <p><b>Finalized Block:</b> {finalizedBlock || "—"}</p>
        <p><b>Anchor Date:</b> {anchorDate || "—"}</p>
        {chainPayload !== null && (
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
            {JSON.stringify(chainPayload, null, 2)}
          </pre>
        )}
        {extrinsicHash && (
          <p>
            Verify: <a href={subscanBase + extrinsicHash} target="_blank">Subscan link</a>
          </p>
        )}
        {extrinsicHash && (
          <button onClick={downloadReceipt} style={{ marginTop: 8 }}>
            Download Receipt JSON
          </button>
        )}
      </div>
    </div>
  );
}
