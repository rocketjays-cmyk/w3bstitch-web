"use client";

import React, { useMemo, useRef, useState } from "react";

/**
 * Minimal anchor UI that builds on Vercel.
 * - All blockchain libs are loaded dynamically on click (no SSR imports).
 * - No Node-only globals are used during build.
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
  const fileRef = useRef<HTMLInputElement | null>(null);

  const wsEndpoint = useMemo(
    () => (network === "westend" ? "wss://westend-rpc.polkadot.io" : "wss://rpc.polkadot.io"),
    [network]
  );

  function toHexFromUtf8(s: string) {
    const bytes = new TextEncoder().encode(s);
    let hex = "0x";
    for (const b of bytes) hex += b.toString(16).padStart(2, "0");
    return hex;
  }

  async function sha256ArrayBuffer(buf: ArrayBuffer) {
    const h = await crypto.subtle.digest("SHA-256", buf);
    const arr = new Uint8Array(h);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

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

  async function connectWallet() {
    setStatus("Connecting wallet…");
    const { web3Enable, web3Accounts } = await import("@polkadot/extension-dapp");
    await web3Enable("W3b Stitch");
    const accounts = await web3Accounts();
    if (!accounts.length) throw new Error("No Polkadot.js extension accounts found.");
    setWallet({ address: accounts[0].address });
    setStatus(`Wallet connected: ${short(accounts[0].address)}`);
  }

  function short(addr: string) {
    return addr.slice(0, 6) + "…" + addr.slice(-6);
  }

  async function doAnchor() {
    if (!hashHex) throw new Error("No hash to anchor.");
    if (!wallet) throw new Error("Connect wallet first.");

    const payload = {
      v: "w3bstitch.anchor",
      alg: "sha256",
      hash: hashHex,
      url: url || "(local file)",
      ts: new Date().toISOString(),
    };

    setStatus("Connecting to chain…");
    const { ApiPromise, WsProvider } = await import("@polkadot/api");
    const { web3FromAddress } = await import("@polkadot/extension-dapp");

    const api = await ApiPromise.create({ provider: new WsProvider(wsEndpoint) });
    const injector = await web3FromAddress(wallet.address);

    const hexPayload = toHexFromUtf8(JSON.stringify(payload));
    const tx = api.tx.system.remarkWithEvent(hexPayload);

    setStatus("Submitting transaction… (waiting for inclusion)");
    const unsub = await tx.signAndSend(
      wallet.address,
      { signer: injector.signer },
      ({ status: st, dispatchError }) => {
        if (dispatchError) {
          const anyErr: any = dispatchError;
          if (anyErr.isModule) {
            const decoded = api.registry.findMetaError(anyErr.asModule);
            setStatus(`Error: ${decoded.section}.${decoded.name} — ${decoded.docs.join(" ")}`);
          } else {
            setStatus(`Error: ${anyErr.toString()}`);
          }
        }
        if (st.isInBlock) {
          setStatus(`In block: ${st.asInBlock.toString()} (waiting for finality)`);
          setExtrinsicHash(tx.hash.toHex());
        }
        if (st.isFinalized) {
          setFinalizedBlock(st.asFinalized.toHex());
          setStatus("✅ Finalized on-chain.");
          unsub();
        }
      }
    );
  }

  const subscanBase =
    network === "westend"
      ? "https://westend.subscan.io/extrinsic/"
      : "https://polkadot.subscan.io/extrinsic/";

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>W3b Stitch — Anchor Media to Polkadot</h1>
      <p>Hash a file or URL, then anchor via <code>system.remarkWithEvent</code>.</p>

      <label style={{ display: "block", marginBottom: 8 }}>
        Network:&nbsp;
        <select value={network} onChange={(e) => setNetwork(e.target.value as any)}>
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
        <p>
          <b>Status:</b> {status || "—"}
        </p>
        <p>
          <b>Bytes:</b> {bytes ?? "—"}
        </p>
        <p>
          <b>SHA-256:</b> {hashHex || "—"}
        </p>
        <p>
          <b>Extrinsic Hash:</b> {extrinsicHash || "—"}
        </p>
        <p>
          <b>Finalized Block:</b> {finalizedBlock || "—"}
        </p>
        {extrinsicHash && (
          <p>
            Verify:{" "}
            <a href={subscanBase + extrinsicHash} target="_blank">
              Subscan link
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
