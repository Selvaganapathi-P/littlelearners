'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Achievement, AchievementType } from '@/types';
import { achievementsApi } from '@/lib/api';
import { getGradeColor } from '@/lib/utils';
import { ChildNav } from '@/components/ChildNav';

const TYPE_ICONS: Record<AchievementType, string> = {
  badge: '🏅',
  trophy: '🏆',
  certificate: '🎓',
};

function AchievementsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const childId = params.get('child') ?? (typeof window !== 'undefined' ? localStorage.getItem('ll_child') : null);
  const grade = (params.get('grade') || 'LKG') as 'LKG' | 'UKG';
  const colors = getGradeColor(grade);

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<{ xp: number; coins: number; level: number; streak: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    if (!childId) { router.push('/onboarding'); return; }
    (achievementsApi.forChild(childId) as Promise<{ data: Achievement[]; stats: typeof stats }>)
      .then(res => {
        setAchievements(res.data);
        setStats(res.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [childId, router]);

  const filtered = achievements.filter(a => {
    if (filter === 'earned') return a.earned;
    if (filter === 'locked') return !a.earned;
    return true;
  });
  const earned = achievements.filter(a => a.earned).length;

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.bg }}>
      {/* Hero header */}
      <div className="relative overflow-hidden px-4 py-10 text-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
        <button onClick={() => router.back()} className="absolute top-4 left-4 text-white/70 hover:text-white text-sm">← Back</button>
        <div className="text-5xl mb-2">🏆</div>
        <h1 className="text-3xl font-black text-white mb-1">Trophy Room</h1>
        <p className="text-white/80 text-sm">{earned} of {achievements.length} trophies earned</p>

        {/* XP/coins/level/streak stats */}
        {stats && (
          <div className="mt-6 flex items-center justify-center gap-4">
            {[
              { icon: '⭐', val: stats.xp, label: 'XP' },
              { icon: '🪙', val: stats.coins, label: 'Coins' },
              { icon: '🔥', val: stats.streak, label: 'Streak' },
              { icon: '⚡', val: `Lv ${stats.level}`, label: 'Level' },
            ].map(s => (
              <div key={s.label} className="text-center bg-white/15 rounded-2xl px-4 py-2">
                <div className="text-xl font-black text-white">{s.icon}{s.val}</div>
                <div className="text-white/70 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-5 max-w-xs mx-auto">
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-3 bg-white rounded-full transition-all" style={{ width: achievements.length ? `${(earned / achievements.length) * 100}%` : '0%' }} />
          </div>
          <p className="text-white/70 text-xs mt-1">{Math.round(achievements.length ? (earned / achievements.length) * 100 : 0)}% complete</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(['all', 'earned', 'locked'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all capitalize ${filter === f ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
            style={filter === f ? { backgroundColor: colors.primary } : {}}>
            {f === 'all' ? `All (${achievements.length})` : f === 'earned' ? `✅ Earned (${earned})` : `🔒 Locked (${achievements.length - earned})`}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filtered.map(ach => (
              <div key={ach._id}
                className={`bg-white rounded-3xl p-5 text-center transition-all ${ach.earned ? 'shadow-md' : 'opacity-50'}`}
                style={ach.earned ? { boxShadow: `0 4px 20px ${colors.primary}33` } : {}}>
                <div className={`text-5xl mb-2 ${!ach.earned ? 'grayscale' : ''}`}>
                  {ach.earned ? ach.icon : '🔒'}
                </div>
                <div className="text-xs font-bold text-gray-400 mb-1">{TYPE_ICONS[ach.type]} {ach.type}</div>
                <p className="font-black text-gray-800 text-sm leading-tight">{ach.name}</p>
                {ach.description && <p className="text-xs text-gray-400 mt-1 leading-snug">{ach.description}</p>}
                {ach.earned ? (
                  <div className="mt-2 text-xs font-bold" style={{ color: colors.primary }}>
                    +{ach.xpReward} XP ✓
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-400">+{ach.xpReward} XP when earned</div>
                )}
                {ach.earned && ach.earnedAt && (
                  <p className="text-xs text-gray-300 mt-0.5">{new Date(ach.earnedAt).toLocaleDateString()}</p>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🎯</div>
                <p className="font-semibold">Keep going — you'll earn these soon!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ChildNav grade={grade} childId={childId} />
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-5xl animate-bounce">🏆</div></div>}>
      <AchievementsContent />
    </Suspense>
  );
}
