'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Lesson, Activity, ActivityType } from '@/types';
import { VIDEO_FORMAT_LABELS, VIDEO_FORMAT_ICONS, ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/types';
import { lessonsApi, activitiesApi, childrenApi } from '@/lib/api';
import { getGradeColor } from '@/lib/utils';
import { StoryReader, FlashcardDeck, QuizGame, MatchingGame, MemoryGame, SpellGame } from '@/components/activities/ActivityPlayer';

// ── Main Page ─────────────────────────────────────────────────────────────────

function ActivityHubContent() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedActivity = searchParams.get('activity') as ActivityType | null;

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpToast, setXpToast] = useState<{ xp: number; coins: number } | null>(null);
  const [childId, setChildId] = useState<string | null>(null);

  useEffect(() => {
    setChildId(typeof window !== 'undefined' ? localStorage.getItem('ll_child') : null);
    Promise.all([
      lessonsApi.get(lessonId) as Promise<{ data: Lesson }>,
      activitiesApi.forLesson(lessonId) as Promise<{ data: Activity[] }>,
    ]).then(([lessonRes, actRes]) => {
      setLesson(lessonRes.data);
      setActivities(actRes.data);
      const preferred = requestedActivity && actRes.data.some(a => a.type === requestedActivity)
        ? requestedActivity
        : actRes.data[0]?.type ?? null;
      setActiveTab(preferred);
    }).catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [lessonId, router, requestedActivity]);

  const handleActivityDone = useCallback((xp: number, coins: number) => {
    setXpToast({ xp, coins });
    setTimeout(() => setXpToast(null), 3000);
    if (childId) {
      childrenApi.recordWatch(childId, lessonId, 100).catch(() => {});
    }
  }, [childId, lessonId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-6xl animate-bounce">🌟</div>
    </div>
  );
  if (!lesson) return null;

  const colors = getGradeColor(lesson.grade);
  const currentActivity = activities.find(a => a.type === activeTab);
  const tabOrder: ActivityType[] = ['story', 'flashcard', 'quiz', 'matching', 'memory', 'spell', 'phonics', 'fill_blank'];
  const availableTabs = tabOrder.filter(t => activities.some(a => a.type === t));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* XP Toast */}
      {xpToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
          style={{ animation: 'slideDown 0.4s ease-out' }}>
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-black text-sm">+{xpToast.xp} XP earned!</p>
              <p className="text-xs text-yellow-100">+{xpToast.coins} coins 🪙</p>
            </div>
          </div>
          {/* Confetti dots */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: ['#FF6B9D','#7C3AED','#06B6D4','#F59E0B','#10B981','#EF4444'][i], top: 0, left: `${20 + i * 12}%`, animation: `confettiPop 0.8s ease-out ${i * 0.08}s both` }} />
          ))}
        </div>
      )}
      <style jsx>{`
        @keyframes slideDown { from { transform: translate(-50%,-40px); opacity:0; } to { transform: translate(-50%,0); opacity:1; } }
        @keyframes confettiPop { 0%{transform:translateY(0) scale(0);opacity:1} 100%{transform:translateY(-60px) scale(1.5);opacity:0} }
      `}</style>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-800 text-sm leading-tight truncate">{lesson.title}</p>
            <p className="text-xs text-gray-400">{VIDEO_FORMAT_ICONS[lesson.videoFormat]} {VIDEO_FORMAT_LABELS[lesson.videoFormat]} · {lesson.grade}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: colors.primary }}>{lesson.grade}</span>
        </div>

        {/* Activity tabs */}
        {availableTabs.length > 1 && (
          <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide max-w-2xl mx-auto">
            {availableTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                style={activeTab === tab ? { backgroundColor: colors.primary } : {}}>
                {ACTIVITY_ICONS[tab]} {ACTIVITY_LABELS[tab]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {!currentActivity ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-lg font-semibold">Activities loading…</p>
          </div>
        ) : currentActivity.type === 'story' ? (
          <StoryReader activity={currentActivity} />
        ) : currentActivity.type === 'flashcard' ? (
          <FlashcardDeck activity={currentActivity} onDone={() => handleActivityDone(currentActivity.xpReward, currentActivity.coinsReward)} />
        ) : currentActivity.type === 'quiz' ? (
          <QuizGame activity={currentActivity} childId={childId} colors={colors} onDone={(s) => handleActivityDone(Math.round(currentActivity.xpReward * s / 100), Math.round(currentActivity.coinsReward * s / 100))} />
        ) : currentActivity.type === 'matching' ? (
          <MatchingGame activity={currentActivity} onDone={() => handleActivityDone(currentActivity.xpReward, currentActivity.coinsReward)} />
        ) : currentActivity.type === 'memory' ? (
          <MemoryGame activity={currentActivity} onDone={() => handleActivityDone(currentActivity.xpReward, currentActivity.coinsReward)} />
        ) : currentActivity.type === 'spell' ? (
          <SpellGame activity={currentActivity} onDone={() => handleActivityDone(currentActivity.xpReward, currentActivity.coinsReward)} />
        ) : (
          <div className="text-center py-20 text-gray-400">Activity type coming soon!</div>
        )}
      </div>

      {/* Tags */}
      {lesson.tags.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-4 flex flex-wrap gap-2 border-t border-gray-100 mt-4">
          {lesson.tags.map(t => (
            <Link key={t} href={`/dashboard?grade=${lesson.grade}&tag=${encodeURIComponent(t)}`}
              className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500 transition">
              #{t}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-6xl animate-bounce">🌟</div></div>}>
      <ActivityHubContent />
    </Suspense>
  );
}
