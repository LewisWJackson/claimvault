import { getEchoChamberStories } from '@/lib/db';
import type { Metadata } from 'next';
import type { Story } from '@/lib/types';
import { Radio, AlertTriangle } from 'lucide-react';
import EchoChamberCard from '@/components/EchoChamberCard';

export const metadata: Metadata = {
  title: 'Echo Chambers — CreatorClaim',
  description: 'Stories where crypto creator coverage is heavily one-sided. Identify blind spots in the narrative.',
};

export default function EchoChambersPage() {
  let echoChambers: Story[] = [];

  try {
    echoChambers = getEchoChamberStories();
  } catch {
    // db function may not exist yet
  }

  const speculative = echoChambers.filter(s => s.echoChamberType === 'speculative_only');
  const reliable = echoChambers.filter(s => s.echoChamberType === 'reliable_only');

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Radio className="w-7 h-7 text-amber-400" />
          Echo Chambers
        </h1>
        <p className="text-sm text-white/40 mt-1 max-w-2xl">
          Stories where coverage is heavily one-sided. These stories are only being discussed
          by creators with a similar validity lean, meaning you may be getting an incomplete picture.
        </p>
      </div>

      {echoChambers.length === 0 ? (
        <section className="glass-card p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Echo Chambers Detected</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            When stories are only covered by creators with the same validity lean
            (all speculative or all verified), they&apos;ll appear here as echo chambers.
          </p>
        </section>
      ) : (
        <>
          {/* Speculative Echo Chambers */}
          {speculative.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Speculative Echo Chambers
                </h2>
                <p className="text-sm text-white/40 mt-1">
                  Stories covered mainly by speculative creators — no verified perspectives available.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {speculative.map((story, i) => (
                  <EchoChamberCard key={story.id} story={story} index={i} />
                ))}
              </div>
            </section>
          )}

          {/* Verified Echo Chambers */}
          {reliable.length > 0 && (
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Verified Echo Chambers
                </h2>
                <p className="text-sm text-white/40 mt-1">
                  Stories covered mainly by verified creators — alternative perspectives may be missing.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reliable.map((story, i) => (
                  <EchoChamberCard key={story.id} story={story} index={i} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
