"use client";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      padding: 24,
      background: "linear-gradient(180deg,#0f172a 0%, #111827 100%)",
      color: "white"
    }}>
      <div style={{ maxWidth: 680, textAlign: "center" }}>
        <h1 style={{ fontSize: 36, marginBottom: 12 }}>W3b Stitch</h1>
        <p style={{ opacity: 0.9, marginBottom: 24 }}>
          Anchor proofs of authenticity for media & credentials on-chain.
          Generate a SHA-256, submit a Polkadot <code>remarkWithEvent</code>, and get a verifiable receipt.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button
            onClick={() => router.push("/anchor")}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: "1px solid #38bdf8",
              background: "#0ea5e9",
              color: "white",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Open Anchor Tool
          </button>

          <a
            href="https://polkadot.js.org/extension/"
            target="_blank"
            rel="noreferrer"
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: "1px solid #6b7280",
              color: "white",
              textDecoration: "none",
              background: "transparent"
            }}
          >
            Get Polkadot.js Extension
          </a>
        </div>

        <div style={{ marginTop: 28, fontSize: 13, opacity: 0.8 }}>
          Tip: Start on <b>Westend (testnet)</b> in the anchor tool to avoid using real DOT.
        </div>
      </div>
    </main>
  );
}
