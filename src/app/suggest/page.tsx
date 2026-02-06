import { UserPlus } from 'lucide-react';
import SuggestForm from '@/components/SuggestForm';

export default function SuggestPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-3">
          <UserPlus className="w-7 h-7 text-orange-400" />
          Suggest a Creator
        </h1>
        <p className="text-sm text-white/40 mt-2 max-w-md mx-auto">
          Know an XRP YouTuber we should be tracking? Submit their channel URL and our system will
          automatically set up transcript scraping and claim analysis.
        </p>
      </div>

      <SuggestForm />

      {/* How it works */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-orange-400 font-bold">1</span>
            </div>
            <h3 className="text-sm font-medium text-white mb-1">Submit URL</h3>
            <p className="text-xs text-white/40">Paste the YouTube channel URL of a crypto creator you want tracked.</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-400 font-bold">2</span>
            </div>
            <h3 className="text-sm font-medium text-white mb-1">We Scrape</h3>
            <p className="text-xs text-white/40">Our system pulls all video transcripts and begins extracting verifiable claims using AI.</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-cyan-400 font-bold">3</span>
            </div>
            <h3 className="text-sm font-medium text-white mb-1">Track &amp; Verify</h3>
            <p className="text-xs text-white/40">Claims are monitored against real-world outcomes and the creator&apos;s accuracy score updates live.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
