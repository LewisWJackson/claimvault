'use client';

import { useState } from 'react';
import { Flag, Loader2, ChevronDown, Send, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type DisputeType = 'never_said' | 'misquoted' | 'out_of_context' | 'wrong_creator';

const disputeTypes: { value: DisputeType; label: string; description: string }[] = [
  { value: 'never_said', label: 'Never Said This', description: 'The creator never made this claim' },
  { value: 'misquoted', label: 'Misquoted', description: 'The claim is inaccurately paraphrased' },
  { value: 'out_of_context', label: 'Out of Context', description: 'The claim is missing important context' },
  { value: 'wrong_creator', label: 'Wrong Creator', description: 'This was said by someone else' },
];

interface DisputeButtonProps {
  claimId: string;
}

export default function DisputeButton({ claimId }: DisputeButtonProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DisputeType>('never_said');
  const [evidence, setEvidence] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    status: string;
    analysis: string;
    confidence: number | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (evidence.length < 20) {
      setError('Please provide more detailed evidence (at least 20 characters)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId, type, evidence, sourceUrl: sourceUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit dispute');
      setResult(data.dispute);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const statusIcon = {
    upheld: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    rejected: <ShieldAlert className="w-4 h-4 text-red-400" />,
    under_investigation: <ShieldQuestion className="w-4 h-4 text-amber-400" />,
    pending_review: <ShieldQuestion className="w-4 h-4 text-blue-400" />,
  };

  const statusLabel: Record<string, string> = {
    upheld: 'Dispute Upheld',
    rejected: 'Dispute Rejected',
    under_investigation: 'Under Investigation',
    pending_review: 'Pending Review',
  };

  return (
    <div className="mt-2">
      {!open && !result && (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-white/30 hover:text-white/50 hover:bg-white/[0.04] transition-all"
        >
          <Flag className="w-3 h-3" />
          Challenge this claim
        </button>
      )}

      <AnimatePresence>
        {open && !result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/60">Challenge Claim</span>
              <button onClick={() => setOpen(false)} className="text-xs text-white/30 hover:text-white/50">
                Cancel
              </button>
            </div>

            {/* Dispute Type */}
            <div className="grid grid-cols-2 gap-1.5">
              {disputeTypes.map(dt => (
                <button
                  key={dt.value}
                  onClick={() => setType(dt.value)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] text-left transition-all ${
                    type === dt.value
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                      : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>

            {/* Evidence */}
            <textarea
              value={evidence}
              onChange={e => setEvidence(e.target.value)}
              placeholder="Describe what was actually said, or why this claim is inaccurate. Be specific — include timestamps, quotes, or context..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 resize-none"
            />

            {/* Source URL */}
            <input
              type="url"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="Source URL (optional — YouTube link with timestamp, article, etc.)"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-orange-500/40"
            />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || evidence.length < 20}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25 hover:bg-orange-500/25 transition-all disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  AI is evaluating...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Submit Challenge
                </>
              )}
            </button>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.08] space-y-2"
          >
            <div className="flex items-center gap-2">
              {statusIcon[result.status as keyof typeof statusIcon]}
              <span className="text-xs font-medium text-white/70">
                {statusLabel[result.status] || result.status}
              </span>
              {result.confidence !== null && (
                <span className="text-[10px] text-white/30">
                  ({(result.confidence * 100).toFixed(0)}% confidence)
                </span>
              )}
            </div>
            {result.analysis && (
              <p className="text-xs text-white/50 leading-relaxed">{result.analysis}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
