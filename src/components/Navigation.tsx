'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Newspaper, Users, Zap, Activity, Trophy, Menu, X, Plus, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'Creators', icon: Users },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/claims', label: 'Claims', icon: Zap },
  { href: '/stories', label: 'Stories', icon: Newspaper },
  { href: '/pulse', label: 'Pulse', icon: Activity },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: 'rgba(10, 10, 26, 0.85)', backdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-white">Creator</span>
              <span className="gradient-text">Claim</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive
                      ? 'text-white bg-white/[0.08] nav-active'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
                  )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://confirmd-app-production.up.railway.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-cyan-400 font-medium">Confirmd News</span>
            </a>
            <Link
              href="/suggest"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs text-orange-400 font-medium">Suggest Creator</span>
            </Link>
            <button
              className="md:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={clsx(
        'md:hidden overflow-hidden transition-all duration-200',
        mobileOpen ? 'max-h-64 pb-3' : 'max-h-0'
      )}>
        <div className="flex items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs transition-all',
                  isActive ? 'text-orange-400' : 'text-white/40'
                )}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
