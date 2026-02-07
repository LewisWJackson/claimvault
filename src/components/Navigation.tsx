'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, Newspaper, Users, Radio, LayoutGrid, Menu, X } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'Stories', icon: Newspaper },
  { href: '/creators', label: 'Creators', icon: Users },
  { href: '/echo-chambers', label: 'Echo Chambers', icon: Radio },
  { href: '/categories', label: 'Categories', icon: LayoutGrid },
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
              <span className="text-white">Claim</span>
              <span className="gradient-text">Vault</span>
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
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/50">Tracking <span className="text-white font-medium">XRP</span></span>
            </div>
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
