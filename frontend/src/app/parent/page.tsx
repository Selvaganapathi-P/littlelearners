'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Child } from '@/types';
import { VIDEO_FORMAT_ICONS } from '@/types';
import { childrenApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { getGradeColor } from '@/lib/utils';

const NAMED_AVATARS: Record<string, string> = {
  default: '🐣', cat: '🐱', dog: '🐶', rabbit: '🐰',
  bear: '🐻', lion: '🦁', elephant: '🐘', owl: '🦉',
};

function resolveAvatar(avatar: string): string {
  return NAMED_AVATARS[avatar] ?? avatar ?? '🐣';
}

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimId, setClaimId] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  function reload() {
    childrenApi.mine()
      .then((res: unknown) => setChildren((res as { data: Child[] }).data ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'parent') { router.replace('/'); return; }

    childrenApi.mine()
      .then((res: unknown) => setChildren((res as { data: Child[] }).data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, router]);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claimId.trim()) return;
    setClaiming(true);
    setClaimError('');
    try {
      await childrenApi.claim(claimId.trim());
      setClaimId('');
      reload();
    } catch (err: unknown) {
      setClaimError(err instanceof Error ? err.message : 'Could not link child');
    } finally {
      setClaiming(false);
    }
  }

  if (!user || user.role !== 'parent') return null;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl text-brand-pink font-display">LittleLearners</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">Hi, {user.name} 👋</span>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-display text-gray-800">Parent Dashboard</h1>
          <p className="text-gray-400 font-body mt-1">Track your child&apos;s learning journey</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-5xl animate-bounce">🌟</div>
          </div>
        ) : children.length === 0 ? (
          /* No children linked yet */
          <div className="bg-white rounded-3xl p-12 text-center card-shadow">
            <div className="text-7xl mb-4">🐣</div>
            <h2 className="text-2xl font-display text-gray-800 mb-2">No child profile yet</h2>
            <p className="text-gray-400 font-body mb-8 max-w-md mx-auto">
              Set up your child&apos;s profile to start tracking their learning journey.
              Once set up, you&apos;ll see their streaks, badges, and favourite videos here.
            </p>
            <Link href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-pink text-white rounded-2xl font-bold text-lg hover:bg-pink-600 transition-colors">
              🎉 Set Up Child Profile
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {children.map(child => {
              const colors = getGradeColor(child.grade as 'LKG' | 'UKG');
              const recentWatched = [...child.watchHistory]
                .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
                .slice(0, 5);

              return (
                <div key={child._id} className="bg-white rounded-3xl p-6 card-shadow">
                  {/* Child header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl"
                      style={{ backgroundColor: colors.secondary + '33' }}>
                      {resolveAvatar(child.avatar)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-800">{child.name}</h2>
                      <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold text-white mt-1"
                        style={{ backgroundColor: colors.primary }}>
                        {child.grade}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/parent/report/${child._id}`}
                        className="px-3 py-2 rounded-2xl text-sm font-bold border-2 transition-colors"
                        style={{ borderColor: colors.primary, color: colors.primary }}>
                        📊 Report
                      </Link>
                      <Link href={`/dashboard?grade=${child.grade}&child=${child._id}`}
                        className="px-4 py-2 rounded-2xl text-sm font-bold text-white transition-colors"
                        style={{ backgroundColor: colors.primary }}>
                        ▶ Watch
                      </Link>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-3 rounded-2xl" style={{ backgroundColor: colors.bg }}>
                      <div className="text-2xl font-display" style={{ color: colors.primary }}>
                        {child.watchHistory.length}
                      </div>
                      <div className="text-xs text-gray-500 font-body mt-0.5">Videos Watched</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl" style={{ backgroundColor: colors.bg }}>
                      <div className="text-2xl font-display" style={{ color: colors.primary }}>
                        {child.streaks?.current ?? 0}🔥
                      </div>
                      <div className="text-xs text-gray-500 font-body mt-0.5">Day Streak</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl" style={{ backgroundColor: colors.bg }}>
                      <div className="text-2xl font-display" style={{ color: colors.primary }}>
                        {child.badges?.length ?? 0}🏅
                      </div>
                      <div className="text-xs text-gray-500 font-body mt-0.5">Badges</div>
                    </div>
                  </div>

                  {/* Badges */}
                  {child.badges && child.badges.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 mb-2">Badges Earned</h3>
                      <div className="flex flex-wrap gap-2">
                        {child.badges.map((badge, i) => (
                          <span key={i}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold">
                            🏅 {badge.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent activity */}
                  {recentWatched.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 mb-3">Recent Activity</h3>
                      <div className="space-y-2">
                        {recentWatched.map((entry, i) => {
                          const lesson = typeof entry.lesson === 'object' ? entry.lesson as { title: string; videoFormat: string } : null;
                          return (
                            <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                              <span className="text-xl flex-shrink-0">
                                {lesson ? VIDEO_FORMAT_ICONS[lesson.videoFormat as keyof typeof VIDEO_FORMAT_ICONS] : '🎬'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-700 truncate">
                                  {lesson?.title ?? 'Unknown lesson'}
                                </p>
                                <p className="text-xs text-gray-400 font-body">
                                  {new Date(entry.watchedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                  {entry.completedPercent >= 80 ? ' · Completed ✓' : ` · ${entry.completedPercent}%`}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add another child */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 rounded-2xl text-gray-400 font-semibold text-sm hover:border-brand-pink hover:text-brand-pink transition-colors">
                + Create New Profile
              </Link>
            </div>

            {/* Link existing child by ID */}
            <div className="bg-white rounded-3xl p-5 card-shadow">
              <h3 className="text-sm font-bold text-gray-700 mb-1">Link an existing child profile</h3>
              <p className="text-xs text-gray-400 font-body mb-3">
                If your child already has a profile, enter their Profile ID to link it to your account.
                You can find the ID in the browser address bar when they&apos;re on their profile page.
              </p>
              <form onSubmit={handleClaim} className="flex gap-2">
                <input
                  value={claimId}
                  onChange={e => setClaimId(e.target.value)}
                  placeholder="Child profile ID…"
                  className="flex-1 text-sm border-2 border-gray-200 rounded-xl px-3 py-2 focus:border-brand-purple outline-none"
                />
                <button type="submit" disabled={claiming || !claimId.trim()}
                  className="px-4 py-2 bg-brand-purple text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-purple-700 transition-colors">
                  {claiming ? '⏳' : 'Link'}
                </button>
              </form>
              {claimError && <p className="text-xs text-red-500 mt-2">{claimError}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
