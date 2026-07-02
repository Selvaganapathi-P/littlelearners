'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/studio',        label: 'Create',   icon: '✏️' },
  { href: '/studio/lessons',label: 'Lessons',  icon: '🎬' },
  { href: '/calendar',      label: 'Calendar', icon: '📅' },
  { href: '/dashboard?grade=LKG', label: 'Preview', icon: '👁️' },
];

export function StaffNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Link href="/" className="text-xl text-brand-pink font-display mr-4">LL</Link>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-pink-50 text-brand-pink'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              )}>
              <span className="text-base">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'founder' && (
            <Link href="/founder" className="text-sm text-brand-purple font-semibold hover:underline">Founder</Link>
          )}
          <span className="text-xs text-gray-400 hidden sm:inline">{user?.name}</span>
          <button onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
