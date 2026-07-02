'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Child } from '@/types';
import { VIDEO_FORMAT_ICONS } from '@/types';
import { api } from '@/lib/api';
import { formatDate, getGradeColor } from '@/lib/utils';

const AVATARS: Record<string, string> = {
  default: '🐣', cat: '🐱', dog: '🐶', rabbit: '🐰',
  bear: '🐻', lion: '🦁', elephant: '🐘', owl: '🦉',
};

export default function ChildProfilePage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ data: Child }>(`/children/${childId}`)
      .then(res => setChild(res.data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [childId, router]);

  if (loading) return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="text-6xl animate-bounce">🌟</div>
    </div>
  );
  if (!child) return null;

  const colors = getGradeColor(child.grade);
  const streakFire = child.streaks.current >= 7 ? '🔥🔥' : child.streaks.current >= 3 ? '🔥' : '⭐';

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-4 py-12 text-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 text-white/70 hover:text-white text-sm transition-colors">
          ← Back
        </button>

        {/* Avatar */}
        <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-6xl shadow-lg">
          {AVATARS[child.avatar] || '🐣'}
        </div>

        <h1 className="text-3xl text-white mb-1">{child.name}</h1>
        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-sm font-semibold">
          {child.grade}
        </span>

        {/* Streak counter */}
        <div className="mt-6 inline-flex items-center gap-3 bg-white/20 rounded-2xl px-5 py-3">
          <div className="text-center">
            <div className="text-3xl">{streakFire}</div>
            <div className="text-white text-xs mt-1 font-semibold">{child.streaks.current} day streak</div>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{child.streaks.longest}</div>
            <div className="text-white/80 text-xs mt-1">Best streak</div>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{child.badges.length}</div>
            <div className="text-white/80 text-xs mt-1">Badges</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Badges */}
        <section>
          <h2 className="text-xl font-display mb-4" style={{ color: colors.primary }}>Badges Earned</h2>
          {child.badges.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center text-gray-400 card-shadow-sm">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-sm">Keep watching to earn badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {child.badges.map((badge, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 text-center card-shadow-sm">
                  <div className="text-3xl mb-1">{VIDEO_FORMAT_ICONS[badge.videoFormat] || '🏅'}</div>
                  <p className="text-xs font-bold text-gray-700 leading-tight">{badge.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(badge.earnedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Watch History */}
        <section>
          <h2 className="text-xl font-display mb-4" style={{ color: colors.primary }}>Recently Watched</h2>
          {child.watchHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center text-gray-400 card-shadow-sm">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm">No videos watched yet.</p>
              <Link href={`/dashboard?grade=${child.grade}`}
                className="text-sm mt-2 inline-block font-semibold" style={{ color: colors.primary }}>
                Start watching →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {child.watchHistory.slice(0, 10).map((entry, i) => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 card-shadow-sm">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {typeof entry.lesson === 'object' && entry.lesson !== null
                        ? (entry.lesson as { title?: string }).title ?? 'Lesson'
                        : 'Lesson'}
                    </p>
                    <p className="text-xs text-gray-400">{entry.watchedAt ? formatDate(entry.watchedAt as unknown as string) : ''}</p>
                  </div>
                  {entry.completedPercent && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs font-bold text-gray-600">{entry.completedPercent}%</div>
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1">
                        <div className="h-1.5 rounded-full" style={{ width: `${entry.completedPercent}%`, backgroundColor: colors.primary }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Go watch more */}
        <div className="text-center pb-4">
          <Link href={`/dashboard?grade=${child.grade}`}
            className="inline-block px-8 py-4 text-white rounded-3xl font-bold text-lg card-shadow"
            style={{ backgroundColor: colors.primary }}>
            Watch More Videos 🎬
          </Link>
        </div>
      </div>
    </div>
  );
}
