import type { Metadata } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'CreatorClaim — Which Crypto YouTubers Can You Trust?',
  description: 'Track crypto creator predictions and verify them against reality. See who\'s trustworthy and who\'s speculating.',
  keywords: ['XRP', 'crypto', 'YouTube', 'predictions', 'accuracy', 'accountability'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-vault-bg" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Background gradient overlay */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-orange-900/10" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl" />
        </div>

        <Navigation />

        <main className="relative z-10 pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/[0.04] py-8 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/30">CreatorClaim</span>
              <span className="text-xs text-white/15">|</span>
              <span className="text-xs text-white/20">Crypto Creator Accountability Platform</span>
            </div>
            <div className="text-xs text-white/15">
              Not financial advice. Historical accuracy does not predict future results.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
