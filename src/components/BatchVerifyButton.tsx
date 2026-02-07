'use client';

import { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';

export default function BatchVerifyButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ processed: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBatch = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'batch_pending' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch verification failed');

      setResult({ processed: data.processed, updated: data.updated });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-3">
      <button
        onClick={handleBatch}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Verifying all...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Verify All Pending
          </>
        )}
      </button>
      {result && (
        <span className="text-xs text-white/50">
          Processed {result.processed}, updated {result.updated} claims. Reloading...
        </span>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
