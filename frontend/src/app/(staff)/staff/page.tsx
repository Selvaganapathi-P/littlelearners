'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

interface Child {
  _id: string;
  name: string;
  grade: 'LKG' | 'UKG';
  avatar: string;
  streaks?: { current: number };
  badges?: { name: string }[];
  watchHistory?: { lesson: unknown; watchedAt: string; completedPercent: number }[];
}

const NAMED_AVATARS: Record<string, string> = {
  default: '🐣', cat: '🐱', dog: '🐶', rabbit: '🐰',
  bear: '🐻', lion: '🦁', elephant: '🐘', owl: '🦉',
};

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'LKG' | 'UKG'>('all');

  useEffect(() => {
    if (!user) { router.replace('/staff-login'); return; }
    if (!['staff', 'admin', 'founder'].includes(user.role)) { router.replace('/'); return; }

    api.get<unknown>('/children?limit=1000')
      .then(res => setChildren(((res as { data?: Child[] }).data ?? []) as Child[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const filtered = children.filter(c => {
    const matchGrade = gradeFilter === 'all' || c.grade === gradeFilter;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchGrade && matchSearch;
  });

  const lkgCount = children.filter(c => c.grade === 'LKG').length;
  const ukgCount = children.filter(c => c.grade === 'UKG').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xl text-brand-pink font-display">LittleLearners</Link>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">Staff</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/studio" className="text-sm font-semibold text-brand-purple hover:underline">Content Studio →</Link>
            <span className="text-sm text-gray-500 hidden sm:inline">Hi, {user.name}</span>
            <button onClick={() => { logout(); router.push('/staff-login'); }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-display text-gray-800">Student Management</h1>
          <p className="text-gray-400 font-body mt-1">View and manage all enrolled students</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Students', value: children.length, color: '#7C3AED', bg: '#F3F0FF' },
            { label: 'LKG', value: lkgCount, color: '#FF6B9D', bg: '#FFF0F6' },
            { label: 'UKG', value: ukgCount, color: '#06B6D4', bg: '#ECFEFF' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-3xl p-5 card-shadow text-center">
              <div className="text-3xl font-display font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-gray-500 font-body mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name…"
            className="flex-1 min-w-[180px] border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-body focus:border-brand-purple outline-none transition-colors"
          />
          <div className="flex gap-2">
            {(['all', 'LKG', 'UKG'] as const).map(g => (
              <button key={g} onClick={() => setGradeFilter(g)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors ${gradeFilter === g ? 'bg-brand-purple text-white' : 'bg-white text-gray-500 border-2 border-gray-200 hover:border-brand-purple'}`}>
                {g === 'all' ? 'All' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Student list */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-5xl animate-bounce">🌟</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center card-shadow">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-400 font-body">{children.length === 0 ? 'No students enrolled yet.' : 'No students match your search.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 card-shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {['Student', 'Grade', 'Videos Watched', 'Streak', 'Badges', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(child => (
                  <tr key={child._id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{NAMED_AVATARS[child.avatar] ?? child.avatar ?? '🐣'}</span>
                        <span className="font-semibold text-gray-800">{child.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${child.grade === 'LKG' ? 'bg-pink-100 text-pink-600' : 'bg-purple-100 text-purple-600'}`}>
                        {child.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700 font-variant-numeric tabular-nums">
                      {child.watchHistory?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {child.streaks?.current ?? 0} 🔥
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {child.badges?.length ?? 0} 🏅
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard?grade=${child.grade}&child=${child._id}`}
                        className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-xl text-xs font-bold hover:bg-purple-200 transition-colors">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Quick links */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link href="/studio"
            className="bg-white rounded-3xl p-5 card-shadow flex items-center gap-3 hover:border-brand-purple border-2 border-transparent transition-colors group">
            <span className="text-3xl">🎬</span>
            <div>
              <div className="font-bold text-gray-800 group-hover:text-brand-purple transition-colors">Content Studio</div>
              <div className="text-xs text-gray-400 font-body">Create & manage lessons</div>
            </div>
          </Link>
          <Link href="/calendar"
            className="bg-white rounded-3xl p-5 card-shadow flex items-center gap-3 hover:border-brand-purple border-2 border-transparent transition-colors group">
            <span className="text-3xl">📅</span>
            <div>
              <div className="font-bold text-gray-800 group-hover:text-brand-purple transition-colors">Content Calendar</div>
              <div className="text-xs text-gray-400 font-body">Weekly learning plan</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
