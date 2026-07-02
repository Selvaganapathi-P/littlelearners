'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Stats {
  totalLessons: number;
  publishedLessons: number;
  totalChildren: number;
  totalSchools: number;
  lessonsByFormat: Record<string, number>;
}

export default function FounderPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const token = typeof window !== 'undefined' ? localStorage.getItem('ll_token') : null;
    if (token || pin === 'founder') {
      setAuthed(true);
    }
  };

  useEffect(() => {
    if (!authed) return;
    Promise.all([
      api.get<{ data: { status: string }[] }>('/lessons?limit=1000').catch(() => ({ data: [] })),
      api.get<{ data: unknown[] }>('/children?limit=1').catch(() => ({ data: [] })),
      api.get<{ data: unknown[] }>('/schools').catch(() => ({ data: [] })),
    ]).then(([lRes, cRes, sRes]) => {
      const lessons = (lRes as { data: { status: string; videoFormat?: string }[] }).data;
      const byFormat: Record<string, number> = {};
      lessons.forEach((l) => { if (l.videoFormat) byFormat[l.videoFormat] = (byFormat[l.videoFormat] || 0) + 1; });
      setStats({
        totalLessons: lessons.length,
        publishedLessons: lessons.filter(l => l.status === 'published').length,
        totalChildren: (cRes as { data: unknown[] }).data.length,
        totalSchools: (sRes as { data: unknown[] }).data.length,
        lessonsByFormat: byFormat,
      });
    }).finally(() => setLoading(false));
  }, [authed]);

  if (!authed) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <form onSubmit={handleAuth} className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm space-y-4">
        <div className="text-center mb-2">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl text-brand-pink">Founder Mode</h1>
        </div>
        <input
          type="password"
          placeholder="Enter founder PIN"
          value={pin}
          onChange={e => setPin(e.target.value)}
          className="w-full bg-gray-800 text-white border border-gray-700 rounded-2xl px-4 py-3 outline-none focus:border-brand-pink transition-colors"
        />
        <button type="submit" className="w-full py-3 bg-brand-pink text-white rounded-2xl font-bold hover:bg-pink-600 transition-colors">
          Enter
        </button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl text-brand-pink">Founder Dashboard</h1>
        <a href="/" className="text-sm text-gray-400 hover:text-white transition-colors">Exit</a>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-5xl animate-spin">⚙️</div>
          </div>
        ) : stats ? (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Lessons', value: stats.totalLessons, icon: '🎬', color: '#FF6B9D' },
                { label: 'Published', value: stats.publishedLessons, icon: '✅', color: '#10B981' },
                { label: 'Schools', value: stats.totalSchools, icon: '🏫', color: '#7C3AED' },
                { label: 'Children', value: stats.totalChildren, icon: '👧', color: '#06B6D4' },
              ].map(stat => (
                <div key={stat.label} className="bg-gray-900 rounded-3xl p-5 border border-gray-800">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-gray-400 mt-1 font-body">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Format breakdown */}
            {Object.keys(stats.lessonsByFormat).length > 0 && (
              <div className="bg-gray-900 rounded-3xl p-6 border border-gray-800">
                <h2 className="text-lg font-bold mb-4 text-gray-200">Lessons by Format</h2>
                <div className="space-y-3">
                  {Object.entries(stats.lessonsByFormat).sort((a, b) => b[1] - a[1]).map(([fmt, count]) => (
                    <div key={fmt} className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-36 capitalize font-body">{fmt.replace(/_/g, ' ')}</span>
                      <div className="flex-1 bg-gray-800 rounded-full h-2">
                        <div className="h-2 rounded-full bg-brand-pink"
                          style={{ width: `${Math.min((count / stats.totalLessons) * 100, 100)}%` }} />
                      </div>
                      <span className="text-sm font-bold text-gray-300 w-8 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Go to Studio', href: '/studio', icon: '🎬', desc: 'Create new lessons' },
                { label: 'Content Calendar', href: '/calendar', icon: '📅', desc: 'Weekly mix & festivals' },
                { label: 'Child Dashboard', href: '/dashboard?grade=LKG', icon: '🐣', desc: 'LKG child view' },
              ].map(action => (
                <a key={action.href} href={action.href}
                  className="bg-gray-900 border border-gray-800 rounded-3xl p-5 hover:border-brand-pink transition-colors group">
                  <div className="text-3xl mb-2">{action.icon}</div>
                  <div className="font-bold text-white group-hover:text-brand-pink transition-colors">{action.label}</div>
                  <div className="text-xs text-gray-400 font-body mt-0.5">{action.desc}</div>
                </a>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-500">Could not load stats. Check API connection.</div>
        )}
      </div>
    </div>
  );
}
