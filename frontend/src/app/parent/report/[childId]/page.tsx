'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Child } from '@/types';
import { VIDEO_FORMAT_ICONS, VIDEO_FORMAT_LABELS } from '@/types';
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

export default function ProgressReportPage() {
  const { childId } = useParams<{ childId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/login'); return; }
    if (user.role !== 'parent') { router.replace('/'); return; }
    childrenApi.get(childId)
      .then((res: unknown) => setChild((res as { data: Child }).data))
      .catch(() => router.replace('/parent'))
      .finally(() => setLoading(false));
  }, [childId, user, router]);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
      <div className="text-5xl animate-bounce">📊</div>
    </div>
  );

  if (!child) return null;

  const colors = getGradeColor(child.grade);
  const totalWatched = child.watchHistory.length;
  const completed = child.watchHistory.filter(h => h.completedPercent >= 80).length;
  const completionRate = totalWatched > 0 ? Math.round((completed / totalWatched) * 100) : 0;

  // Format frequency map
  const formatCounts: Record<string, number> = {};
  child.watchHistory.forEach(h => {
    if (typeof h.lesson === 'object' && h.lesson?.videoFormat) {
      formatCounts[h.lesson.videoFormat] = (formatCounts[h.lesson.videoFormat] || 0) + 1;
    }
  });
  const topFormats = Object.entries(formatCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const recentActivity = [...child.watchHistory]
    .sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime())
    .slice(0, 10);

  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Screen-only nav */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10 print:hidden">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/parent" className="text-sm text-gray-500 hover:text-brand-pink transition-colors">← Back</Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-brand-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 transition-colors">
            🖨 Print / Save PDF
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 print:py-6 print:px-0">
        {/* Report header */}
        <div className="bg-white rounded-3xl p-8 card-shadow text-center print:shadow-none print:border print:border-gray-200">
          <div className="text-6xl mb-3">{resolveAvatar(child.avatar)}</div>
          <h1 className="text-3xl font-display text-gray-800 mb-1">{child.name}</h1>
          <span className="inline-block px-4 py-1 rounded-full text-sm font-bold text-white mb-4"
            style={{ backgroundColor: colors.primary }}>
            {child.grade} Progress Report
          </span>
          <p className="text-xs text-gray-400 font-body">Generated on {today} · LittleLearners</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Videos Watched', value: totalWatched, icon: '🎬', color: colors.primary },
            { label: 'Completed', value: `${completionRate}%`, icon: '✅', color: '#10B981' },
            { label: 'Day Streak', value: `${child.streaks?.current ?? 0}🔥`, icon: '', color: '#F59E0B' },
            { label: 'Badges', value: child.badges?.length ?? 0, icon: '🏅', color: '#7C3AED' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-3xl p-5 card-shadow text-center print:shadow-none print:border print:border-gray-200">
              {stat.icon && <div className="text-2xl mb-1">{stat.icon}</div>}
              <div className="text-3xl font-display font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-gray-400 font-body mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        {child.badges && child.badges.length > 0 && (
          <div className="bg-white rounded-3xl p-6 card-shadow print:shadow-none print:border print:border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">🏅 Badges Earned</h2>
            <div className="flex flex-wrap gap-2">
              {child.badges.map((badge, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-2xl text-sm font-bold">
                  🏅 {badge.name}
                  <span className="text-xs font-normal text-yellow-500 ml-1">
                    {new Date(badge.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Favourite formats */}
        {topFormats.length > 0 && (
          <div className="bg-white rounded-3xl p-6 card-shadow print:shadow-none print:border print:border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">❤️ Favourite Video Types</h2>
            <div className="space-y-3">
              {topFormats.map(([fmt, count]) => {
                const pct = totalWatched > 0 ? Math.round((count / totalWatched) * 100) : 0;
                return (
                  <div key={fmt} className="flex items-center gap-3">
                    <span className="text-xl w-7 text-center">{VIDEO_FORMAT_ICONS[fmt as keyof typeof VIDEO_FORMAT_ICONS]}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-700">{VIDEO_FORMAT_LABELS[fmt as keyof typeof VIDEO_FORMAT_LABELS]}</span>
                        <span className="text-xs text-gray-400 font-body">{count} videos</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors.primary }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white rounded-3xl p-6 card-shadow print:shadow-none print:border print:border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Recent Activity</h2>
            <div className="space-y-2">
              {recentActivity.map((entry, i) => {
                const lesson = typeof entry.lesson === 'object' ? entry.lesson as { title?: string; videoFormat?: string } : null;
                return (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-xl flex-shrink-0">
                      {lesson?.videoFormat ? VIDEO_FORMAT_ICONS[lesson.videoFormat as keyof typeof VIDEO_FORMAT_ICONS] : '🎬'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-700 truncate">{lesson?.title ?? 'Unknown'}</p>
                      <p className="text-xs text-gray-400 font-body">
                        {new Date(entry.watchedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${entry.completedPercent >= 80 ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                        {entry.completedPercent >= 80 ? 'Completed ✓' : `${entry.completedPercent}%`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4 print:py-8">
          <p className="text-sm text-gray-400 font-body">LittleLearners — Joyful Learning for LKG & UKG · littlelearners.in</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          header { display: none !important; }
          .card-shadow { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
