'use client';

import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VerifyButtonProps {
  claimId: string;
  currentStatus: string;
  onVerified?: (result: { status: string; notes: string }) => void;
}

export default function VerifyButton({ claimId, currentStatus, onVerified }: VerifyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    confidence: number;
    notes: string;
    evidence: string;
    reasoning: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (currentStatus !== 'pending') return null;

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, mode: 'single' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      setResult(data.result);
      onVerified?.({ status: data.result.status, notes: data.result.notes });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      {!result && !loading && (
        <button
          onClick={handleVerify}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
        >
          <Search className="w-3.5 h-3.5" />
          Verify with Web Search
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Searching and analyzing...
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.05] space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">AI Verdict:</span>
              <span className="text-xs font-medium text-white/80">
                {result.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-white/30">
                ({(result.confidence * 100).toFixed(0)}% confidence)
              </span>
            </div>
            {result.notes && (
              <p className="text-xs text-white/60 leading-relaxed">{result.notes}</p>
            )}
            {result.reasoning && (
              <details className="text-xs text-white/40">
                <summary className="cursor-pointer hover:text-white/60 transition-colors">
                  Show reasoning
                </summary>
                <p className="mt-1 leading-relaxed">{result.reasoning}</p>
              </details>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}
