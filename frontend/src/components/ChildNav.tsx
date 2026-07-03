'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ChildNavProps {
  grade: 'LKG' | 'UKG';
  childId?: string | null;
}

export function ChildNav({ grade, childId }: ChildNavProps) {
  const pathname = usePathname();
  const color = grade === 'LKG' ? '#FF6B9D' : '#7C3AED';

  const items = [
    { href: `/dashboard?grade=${grade}`, icon: '🏠', label: 'Home', match: '/dashboard' },
    { href: `/dashboard?grade=${grade}&focus=search`, icon: '🔍', label: 'Search', match: null },
    { href: childId ? `/achievements?child=${childId}&grade=${grade}` : '/onboarding', icon: '🏆', label: 'Trophies', match: '/achievements' },
    { href: `/daily-challenge?grade=${grade}${childId ? `&child=${childId}` : ''}`, icon: '⚡', label: 'Challenge', match: '/daily-challenge' },
    { href: childId ? `/profile/${childId}` : '/onboarding', icon: childId ? '👤' : '➕', label: childId ? 'Me' : 'Setup', match: childId ? '/profile' : '/onboarding' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-2 py-2 flex items-center justify-around safe-bottom"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
      {items.map(item => {
        const isActive = item.match ? pathname.startsWith(item.match) : false;
        return (
          <Link key={item.label} href={item.href}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-2xl transition-all"
            style={isActive ? { color } : { color: '#9ca3af' }}>
            <span className="text-xl leading-none">{item.icon}</span>
            <span className={`text-xs font-bold ${isActive ? '' : 'opacity-60'}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
