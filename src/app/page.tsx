export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white flex items-center justify-center">
      <div className="text-center px-6">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
          W3b Stitch — <span className="text-indigo-400">Proof of Authenticity</span>
        </h1>

        <p className="mb-10 text-lg text-gray-300 max-w-2xl mx-auto">
          A decentralized trust engine for verifying media, credentials, and identities.
          Built on <span className="font-semibold">Polkadot</span> for security and interoperability.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <a
            href="/polkadot"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition"
          >
            🔗 Polkadot Connectivity
          </a>

          <a
            href="/verify"
            className="px-6 py-3 bg-white hover:bg-gray-200 text-black font-semibold rounded-xl shadow-lg transition"
          >
            ✅ Try Verification
          </a>

          <a
            href="/credential"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg transition"
          >
            🎓 Credential → QR
          </a>
        </div>

        <footer className="mt-16 text-gray-500 text-sm">
          © {new Date().getFullYear()} W3b Stitch Technologies LLC
        </footer>
      </div>
    </main>
  );
}
