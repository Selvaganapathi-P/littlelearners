'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Grade, Lesson, ThemedCompilation, VideoFormat } from '@/types';
import { VIDEO_FORMAT_ICONS } from '@/types';
import { lessonsApi, compilationsApi, childrenApi } from '@/lib/api';
import type { Child } from '@/types';
import { ChildNav } from '@/components/ChildNav';
import { getGradeColor } from '@/lib/utils';

const CATEGORIES: { label: string; format: VideoFormat; emoji: string }[] = [
  { label: 'Rhymes',   format: 'sing_along',      emoji: '🎤' },
  { label: 'Phonics',  format: 'phonics_song',     emoji: '🔤' },
  { label: 'Numbers',  format: 'number_song',      emoji: '🔢' },
  { label: 'Stories',  format: 'moral_story',      emoji: '📖' },
  { label: 'Dance',    format: 'action_dance',     emoji: '💃' },
  { label: 'Yoga',     format: 'yoga_stretch',     emoji: '🧘' },
  { label: 'Habits',   format: 'good_habits',      emoji: '✨' },
  { label: 'Festival', format: 'festival_special', emoji: '🎉' },
];

const LEARNING_FEATURES = [
  { type: 'story',     label: 'Story',      emoji: '📖', color: '#FF6B9D', bg: '#FFF0F5', desc: 'Read & listen' },
  { type: 'flashcard', label: 'Flashcards', emoji: '🃏', color: '#7C3AED', bg: '#F5F0FF', desc: 'Flip & learn'  },
  { type: 'quiz',      label: 'Quiz',       emoji: '❓', color: '#F59E0B', bg: '#FFFBEB', desc: 'Test yourself' },
  { type: 'matching',  label: 'Match It',   emoji: '🎯', color: '#10B981', bg: '#F0FDF4', desc: 'Find the pairs' },
  { type: 'memory',    label: 'Memory',     emoji: '🧠', color: '#3B82F6', bg: '#EFF6FF', desc: 'Flip & remember' },
  { type: 'spell',     label: 'Spell It',   emoji: '✍️', color: '#EC4899', bg: '#FDF2F8', desc: 'Build the word' },
];

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const grade = (params.get('grade') || 'LKG') as Grade;
  const colors = getGradeColor(grade);

  const [firstLesson, setFirstLesson] = useState<Lesson | null>(null);
  const [compilations, setCompilations] = useState<ThemedCompilation[]>([]);
  const [activeFormat, setActiveFormat] = useState<VideoFormat | null>(null);
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const [continueWatching, setContinueWatching] = useState<{ lesson: Lesson; completedPercent: number }[]>([]);
  const [childInfo, setChildInfo] = useState<{
    name: string; avatar: string; streak: number; xp: number; coins: number; level: number;
  } | null>(null);

  useEffect(() => {
    const childFromUrl = params.get('child');
    const id = childFromUrl ?? localStorage.getItem('ll_child');
    if (childFromUrl) localStorage.setItem('ll_child', childFromUrl);
    setChildId(id);
    if (!id) return;
    childrenApi.get(id)
      .then((res: unknown) => {
        const child = (res as { data: Child }).data;
        if (!params.get('grade') && child.grade) {
          router.replace(`/dashboard?grade=${child.grade}&child=${id}`);
          return;
        }
        setChildInfo({ name: child.name, avatar: child.avatar, streak: child.streaks.current, xp: child.xp ?? 0, coins: child.coins ?? 0, level: child.level ?? 1 });
        const seen = new Set<string>();
        const incomplete: { lesson: Lesson; completedPercent: number }[] = [];
        for (const h of [...child.watchHistory].reverse()) {
          if (h.completedPercent >= 90 || typeof h.lesson !== 'object' || !h.lesson) continue;
          const l = h.lesson as Lesson;
          if (seen.has(l._id)) continue;
          seen.add(l._id);
          incomplete.push({ lesson: l, completedPercent: h.completedPercent });
          if (incomplete.length >= 4) break;
        }
        setContinueWatching(incomplete);
      })
      .catch(() => {});
  }, [params, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const lessonRes = await lessonsApi.list({ grade, limit: '1', ...(activeFormat ? { format: activeFormat } : {}) }) as { data: Lesson[] };
      setFirstLesson(lessonRes.data?.[0] ?? null);
      if (!activeFormat) {
        compilationsApi.list(grade)
          .then((r: unknown) => setCompilations((r as { data: ThemedCompilation[] }).data))
          .catch(() => {});
      }
    } finally {
      setLoading(false);
    }
  }, [grade, activeFormat]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function startFeature(type: string) {
    if (!firstLesson) return;
    router.push(`/watch/${firstLesson._id}?activity=${type}`);
  }

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
          <p className="text-sm text-gray-400 font-body mt-1">Pick a topic, then choose how to learn!</p>
        </div>

        {/* Topic filter */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Choose a Topic</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setActiveFormat(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${!activeFormat ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              style={!activeFormat ? { backgroundColor: colors.primary } : {}}>
              All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.format}
                onClick={() => setActiveFormat(prev => prev === c.format ? null : c.format)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeFormat === c.format ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                style={activeFormat === c.format ? { backgroundColor: colors.primary } : {}}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Continue Learning */}
        {continueWatching.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Continue Learning</p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
              {continueWatching.map(({ lesson, completedPercent }) => (
                <Link key={lesson._id} href={`/watch/${lesson._id}`} className="flex-shrink-0 w-40">
                  <div className="bg-white rounded-2xl overflow-hidden card-shadow hover:scale-105 transition-transform">
                    <div className="h-20 flex items-center justify-center text-3xl" style={{ backgroundColor: colors.secondary + '22' }}>
                      {VIDEO_FORMAT_ICONS[lesson.videoFormat]}
                    </div>
                    <div className="h-1 bg-gray-100">
                      <div className="h-1" style={{ width: `${completedPercent}%`, backgroundColor: colors.primary }} />
                    </div>
                    <div className="p-2.5">
                      <p className="font-bold text-gray-800 text-xs leading-tight line-clamp-2">{lesson.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: colors.primary }}>{completedPercent}% done</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Learning Feature Tiles */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            {loading
              ? 'Loading…'
              : firstLesson
                ? `How do you want to learn today?`
                : 'No lessons yet for this topic'}
          </p>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-3xl bg-white animate-pulse" />
              ))}
            </div>
          ) : firstLesson ? (
            <>
              <p className="text-sm font-semibold text-gray-500 mb-4 truncate">
                Lesson: <span style={{ color: colors.primary }}>{firstLesson.title}</span>
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {LEARNING_FEATURES.map(f => (
                  <button
                    key={f.type}
                    onClick={() => startFeature(f.type)}
                    className="relative group text-left rounded-3xl p-5 transition-all duration-200 hover:scale-[1.04] active:scale-95 overflow-hidden shadow-sm hover:shadow-md"
                    style={{ backgroundColor: f.bg }}>
                    <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-15" style={{ backgroundColor: f.color }} />
                    <div className="text-4xl mb-3 relative">{f.emoji}</div>
                    <p className="font-display text-lg leading-tight relative" style={{ color: f.color }}>{f.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-body relative">{f.desc}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <div className="text-5xl mb-3">📚</div>
              <p className="text-sm">No lessons yet. Ask your teacher to create some!</p>
            </div>
          )}
        </div>

        {/* Themed Collections */}
        {compilations.length > 0 && !activeFormat && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Themed Collections</p>
            <div className="grid grid-cols-2 gap-3">
              {compilations.map(comp => (
                <Link key={comp._id} href={`/playlist/${comp._id}`}>
                  <div className="bg-white rounded-2xl p-4 card-shadow hover:scale-[1.03] transition-transform flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">📋</span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{comp.title}</p>
                      <p className="text-xs text-gray-400">{comp.lessons.length} lessons</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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
