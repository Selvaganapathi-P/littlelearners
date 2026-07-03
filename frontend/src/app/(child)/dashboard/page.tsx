'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Grade, Lesson, Activity, ActivityType } from '@/types';
import { ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/types';
import { lessonsApi, activitiesApi, childrenApi } from '@/lib/api';
import type { Child } from '@/types';
import { ChildNav } from '@/components/ChildNav';
import { getGradeColor } from '@/lib/utils';
import {
  StoryReader, FlashcardDeck, QuizGame,
  MatchingGame, MemoryGame, SpellGame,
} from '@/components/activities/ActivityPlayer';

const LEARNING_FEATURES: { type: ActivityType; label: string; emoji: string; color: string; bg: string; desc: string }[] = [
  { type: 'story',     label: 'Story',      emoji: '📖', color: '#FF6B9D', bg: '#FFF0F5', desc: 'Read & listen'   },
  { type: 'flashcard', label: 'Flashcards', emoji: '🃏', color: '#7C3AED', bg: '#F5F0FF', desc: 'Flip & learn'    },
  { type: 'quiz',      label: 'Quiz',       emoji: '❓', color: '#F59E0B', bg: '#FFFBEB', desc: 'Test yourself'   },
  { type: 'matching',  label: 'Match It',   emoji: '🎯', color: '#10B981', bg: '#F0FDF4', desc: 'Find the pairs'  },
  { type: 'memory',    label: 'Memory',     emoji: '🧠', color: '#3B82F6', bg: '#EFF6FF', desc: 'Flip & remember' },
  { type: 'spell',     label: 'Spell It',   emoji: '✍️', color: '#EC4899', bg: '#FDF2F8', desc: 'Build the word'  },
];

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const grade = (params.get('grade') || 'LKG') as Grade;
  const colors = getGradeColor(grade);

  // Home state
  const [childId, setChildId] = useState<string | null>(null);
  const [childInfo, setChildInfo] = useState<{ name: string; avatar: string; streak: number; xp: number; coins: number; level: number } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [homeLoading, setHomeLoading] = useState(true);

  // Activity state (when a tile is clicked)
  const [activeFeature, setActiveFeature] = useState<(typeof LEARNING_FEATURES)[0] | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [actLoading, setActLoading] = useState(false);
  const [xpToast, setXpToast] = useState<{ xp: number; coins: number } | null>(null);

  // Load child + lessons on mount
  useEffect(() => {
    const childFromUrl = params.get('child');
    const id = childFromUrl ?? localStorage.getItem('ll_child');
    if (childFromUrl) localStorage.setItem('ll_child', childFromUrl);
    setChildId(id);

    const loadLessons = lessonsApi.list({ grade, limit: '20' }) as Promise<{ data: Lesson[] }>;

    if (id) {
      Promise.all([
        childrenApi.get(id) as Promise<{ data: Child }>,
        loadLessons,
      ]).then(([childRes, lessonRes]) => {
        const child = childRes.data;
        if (!params.get('grade') && child.grade) {
          router.replace(`/dashboard?grade=${child.grade}&child=${id}`);
          return;
        }
        setChildInfo({ name: child.name, avatar: child.avatar, streak: child.streaks.current, xp: child.xp ?? 0, coins: child.coins ?? 0, level: child.level ?? 1 });
        setLessons(lessonRes.data);
      }).catch(() => {}).finally(() => setHomeLoading(false));
    } else {
      loadLessons.then(r => setLessons(r.data)).catch(() => {}).finally(() => setHomeLoading(false));
    }
  }, [params, router, grade]);

  async function openFeature(feature: typeof LEARNING_FEATURES[0]) {
    if (!lessons.length) return;
    setActLoading(true);
    setActiveFeature(feature);
    setActivities([]);
    setCurrentLesson(null);

    // Try each lesson until we find one with this activity type
    for (const lesson of lessons) {
      try {
        const res = await activitiesApi.forLesson(lesson._id) as { data: Activity[] };
        const match = res.data.find(a => a.type === feature.type);
        if (match) {
          setCurrentLesson(lesson);
          setActivities(res.data);
          setActLoading(false);
          return;
        }
      } catch { continue; }
    }
    // None found — still show the first lesson's activities
    try {
      const res = await activitiesApi.forLesson(lessons[0]._id) as { data: Activity[] };
      setCurrentLesson(lessons[0]);
      setActivities(res.data);
    } catch {}
    setActLoading(false);
  }

  function goHome() {
    setActiveFeature(null);
    setActivities([]);
    setCurrentLesson(null);
    setXpToast(null);
  }

  function handleDone(xp: number, coins: number) {
    setXpToast({ xp, coins });
    if (childId && currentLesson) {
      childrenApi.recordWatch(childId, currentLesson._id, 100).catch(() => {});
    }
    setTimeout(() => setXpToast(null), 3000);
  }

  // ── Activity view ────────────────────────────────────────────────────────────
  if (activeFeature) {
    const activity = activities.find(a => a.type === activeFeature.type);

    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        {/* XP Toast */}
        {xpToast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-none"
            style={{ animation: 'slideDown 0.4s ease-out' }}>
            <span className="text-2xl">⭐</span>
            <div>
              <p className="font-black text-sm">+{xpToast.xp} XP earned!</p>
              <p className="text-xs text-yellow-100">+{xpToast.coins} coins 🪙</p>
            </div>
          </div>
        )}
        <style>{`@keyframes slideDown{from{transform:translate(-50%,-40px);opacity:0}to{transform:translate(-50%,0);opacity:1}}`}</style>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={goHome}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition flex-shrink-0">
              ←
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-2xl">{activeFeature.emoji}</span>
              <div className="min-w-0">
                <p className="font-black text-gray-800 text-sm">{activeFeature.label}</p>
                {currentLesson && <p className="text-xs text-gray-400 truncate">{currentLesson.title}</p>}
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: colors.primary }}>{grade}</span>
          </div>

          {/* Switch activity type tabs */}
          {activities.length > 0 && (
            <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide max-w-lg mx-auto">
              {LEARNING_FEATURES.filter(f => activities.some(a => a.type === f.type)).map(f => (
                <button key={f.type} onClick={() => setActiveFeature(f)}
                  className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${activeFeature.type === f.type ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  style={activeFeature.type === f.type ? { backgroundColor: f.color } : {}}>
                  {f.emoji} {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="max-w-lg mx-auto">
          {actLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="text-6xl animate-bounce">{activeFeature.emoji}</div>
              <p className="text-gray-400 font-semibold">Loading {activeFeature.label}…</p>
            </div>
          ) : !activity ? (
            <div className="text-center py-20 px-4">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-lg font-semibold text-gray-700">No {activeFeature.label} activity yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-6">Ask your teacher to create a lesson with more content</p>
              <button onClick={goHome}
                className="px-6 py-3 rounded-2xl font-bold text-white"
                style={{ backgroundColor: colors.primary }}>
                ← Back to Home
              </button>
            </div>
          ) : activity.type === 'story' ? (
            <StoryReader activity={activity} />
          ) : activity.type === 'flashcard' ? (
            <FlashcardDeck activity={activity} onDone={() => handleDone(activity.xpReward, activity.coinsReward)} />
          ) : activity.type === 'quiz' ? (
            <QuizGame activity={activity} childId={childId} colors={colors} onDone={(s) => handleDone(Math.round(activity.xpReward * s / 100), Math.round(activity.coinsReward * s / 100))} />
          ) : activity.type === 'matching' ? (
            <MatchingGame activity={activity} onDone={() => handleDone(activity.xpReward, activity.coinsReward)} />
          ) : activity.type === 'memory' ? (
            <MemoryGame activity={activity} onDone={() => handleDone(activity.xpReward, activity.coinsReward)} />
          ) : activity.type === 'spell' ? (
            <SpellGame activity={activity} onDone={() => handleDone(activity.xpReward, activity.coinsReward)} />
          ) : (
            <div className="text-center py-20 text-gray-400">Coming soon!</div>
          )}
        </div>

        <ChildNav grade={grade} childId={childId} />
      </div>
    );
  }

  // ── Home / Tile selection view ───────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-display" style={{ color: colors.primary }}>LittleLearners</Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard?grade=${grade === 'LKG' ? 'UKG' : 'LKG'}${childId ? `&child=${childId}` : ''}`}
            className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors"
            style={{ borderColor: colors.primary, color: colors.primary }}>
            {grade === 'LKG' ? '🦋 UKG' : '🐣 LKG'}
          </Link>
          {childId ? (
            <Link href={`/profile/${childId}`}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: colors.primary }}>
              👤 Me
            </Link>
          ) : (
            <Link href="/onboarding"
              className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors"
              style={{ borderColor: colors.primary, color: colors.primary }}>
              + Setup
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">

        {/* Child stats */}
        {childInfo && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-2xl card-shadow-sm">
            <div className="relative flex-shrink-0">
              <span className="text-3xl">{childInfo.avatar}</span>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-black text-gray-900">
                {childInfo.level}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{childInfo.name}</p>
              <p className="text-xs text-gray-400">Level {childInfo.level}</p>
            </div>
            <div className="flex items-center gap-3 text-center">
              <div>
                <div className="text-sm font-bold" style={{ color: colors.primary }}>{childInfo.streak}🔥</div>
                <div className="text-xs text-gray-400">streak</div>
              </div>
              <div className="w-px h-5 bg-gray-100" />
              <div>
                <div className="text-sm font-bold text-yellow-500">⭐{childInfo.xp}</div>
                <div className="text-xs text-gray-400">XP</div>
              </div>
              <div className="w-px h-5 bg-gray-100" />
              <div>
                <div className="text-sm font-bold text-amber-500">🪙{childInfo.coins}</div>
                <div className="text-xs text-gray-400">coins</div>
              </div>
            </div>
          </div>
        )}

        {/* Grade title */}
        <div className="text-center pt-2">
          <h1 className="text-3xl font-display" style={{ color: colors.primary }}>
            {grade === 'LKG' ? '🐣 LKG' : '🦋 UKG'} Learning
          </h1>
          <p className="text-sm text-gray-400 font-body mt-1">
            {homeLoading ? 'Loading…' : lessons.length ? 'Tap any activity to start!' : 'No lessons yet — ask your teacher!'}
          </p>
        </div>

        {/* Feature tiles */}
        {homeLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-white animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {LEARNING_FEATURES.map(f => (
              <button
                key={f.type}
                onClick={() => openFeature(f)}
                disabled={!lessons.length}
                className="relative text-left rounded-3xl p-5 transition-all duration-200 hover:scale-[1.04] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden shadow-sm hover:shadow-lg"
                style={{ backgroundColor: f.bg }}>
                <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-20" style={{ backgroundColor: f.color }} />
                <div className="text-4xl mb-3 relative">{f.emoji}</div>
                <p className="font-display text-lg leading-tight relative" style={{ color: f.color }}>{f.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 font-body relative">{f.desc}</p>
              </button>
            ))}
          </div>
        )}

      </div>
      <ChildNav grade={grade} childId={childId} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-bounce">🌟</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
