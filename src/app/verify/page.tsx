'use client';

import { useState } from 'react';

export default function VerifyPage() {
  const [input, setInput] = useState('');
  const [result, setResult] =
    useState<null | { ok: boolean; message: string }>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: input }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ ok: false, message: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto mt-10 p-6">
      <h1 className="text-3xl font-bold mb-4">Verify Credential (Mock)</h1>
      <p className="mb-6 text-sm text-gray-600">
        Paste a credential hash / JSON. This demo calls a serverless route and returns a mock result.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          className="w-full h-40 p-3 border rounded-xl"
          placeholder="Paste credential or hash..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          required
        />
        <button
          className="px-4 py-2 rounded-xl border disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Verifying…' : 'Verify'}
        </button>
      </form>

      {result && (
        <div
          className={`mt-6 p-4 rounded-xl border ${
            result.ok ? 'border-green-500 bg-green-50/5' : 'border-red-500 bg-red-50/5'
          }`}
        >
          <b className={result.ok ? 'text-green-400' : 'text-red-400'}>
            {result.ok ? 'Valid' : 'Invalid'}
          </b>
          <p className="mt-1">{result.message}</p>
        </div>
      )}
    </main>
  );
}
