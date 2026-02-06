'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, Youtube } from 'lucide-react';

export default function SuggestForm() {
  const [channelUrl, setChannelUrl] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelUrl, note }),
      });

      if (res.ok) {
        setSubmitted(true);
        setChannelUrl('');
        setNote('');
      }
    } catch (err) {
      console.error('Failed to submit suggestion:', err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 text-center max-w-lg mx-auto"
      >
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Suggestion Submitted!</h3>
        <p className="text-white/50 mb-6">We&apos;ll review this channel and start tracking their claims if they meet our criteria.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/70 hover:bg-white/[0.1] transition-all text-sm"
        >
          Suggest Another
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 max-w-lg mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Youtube className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Suggest a Creator</h3>
          <p className="text-xs text-white/40">Know an XRP YouTuber we should track?</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">YouTube Channel URL</label>
          <input
            type="url"
            value={channelUrl}
            onChange={(e) => setChannelUrl(e.target.value)}
            placeholder="https://youtube.com/@channelname"
            required
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why should we track this creator?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all text-sm resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !channelUrl}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Suggestion
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
