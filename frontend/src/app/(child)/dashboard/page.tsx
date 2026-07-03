'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Grade, Lesson, ThemedCompilation, VideoFormat } from '@/types';
import { VIDEO_FORMAT_ICONS, VIDEO_FORMAT_LABELS } from '@/types';
import { lessonsApi, compilationsApi, childrenApi } from '@/lib/api';
import type { Child } from '@/types';
import { ChildNav } from '@/components/ChildNav';
import { formatDuration, getGradeColor } from '@/lib/utils';

const PAGE_SIZE = 16;

const CATEGORIES: { label: string; format: VideoFormat; emoji: string }[] = [
  { label: 'Rhymes',   format: 'sing_along',    emoji: '🎤' },
  { label: 'Phonics',  format: 'phonics_song',   emoji: '🔤' },
  { label: 'Numbers',  format: 'number_song',    emoji: '🔢' },
  { label: 'Stories',  format: 'moral_story',    emoji: '📖' },
  { label: 'Dance',    format: 'action_dance',   emoji: '💃' },
  { label: 'Yoga',     format: 'yoga_stretch',   emoji: '🧘' },
  { label: 'Habits',   format: 'good_habits',    emoji: '✨' },
  { label: 'Festival', format: 'festival_special', emoji: '🎉' },
];

function DashboardContent() {
  const params = useSearchParams();
  const router = useRouter();
  const grade = (params.get('grade') || 'LKG') as Grade;
  const colors = getGradeColor(grade);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [compilations, setCompilations] = useState<ThemedCompilation[]>([]);
  const [activeFormat, setActiveFormat] = useState<VideoFormat | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [childId, setChildId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(() => null);
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [continueWatching, setContinueWatching] = useState<{ lesson: Lesson; completedPercent: number }[]>([]);
  const [childInfo, setChildInfo] = useState<{ name: string; avatar: string; streak: number; totalWatched: number; xp: number; coins: number; level: number } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search or set tag filter from URL params
  useEffect(() => {
    if (params.get('focus') === 'search') {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
    const tag = params.get('tag');
    if (tag) setTagFilter(tag);
  }, [params]);

  // Persist childId, auto-detect grade, load watched history + continue watching
  useEffect(() => {
    const childFromUrl = params.get('child');
    const id = childFromUrl ?? localStorage.getItem('ll_child');
    if (childFromUrl) localStorage.setItem('ll_child', childFromUrl);
    setChildId(id);
    if (id) {
      childrenApi.get(id)
        .then((res: unknown) => {
          const child = (res as { data: Child }).data;

          // If no grade in URL, redirect to child's grade
          if (!params.get('grade') && child.grade) {
            router.replace(`/dashboard?grade=${child.grade}${id ? `&child=${id}` : ''}`);
            return;
          }

          setChildInfo({
            name: child.name,
            avatar: child.avatar,
            streak: child.streaks.current,
            totalWatched: child.watchHistory.length,
            xp: child.xp ?? 0,
            coins: child.coins ?? 0,
            level: child.level ?? 1,
          });

          const ids = new Set(child.watchHistory.map(h =>
            typeof h.lesson === 'object' && h.lesson !== null
              ? (h.lesson as { _id: string })._id
              : h.lesson as string
          ));
          setWatchedIds(ids);

          // Build "continue watching" from recent incomplete watches
          const seen = new Set<string>();
          const incomplete: { lesson: Lesson; completedPercent: number }[] = [];
          for (const h of [...child.watchHistory].reverse()) {
            if (h.completedPercent >= 90) continue;
            if (typeof h.lesson !== 'object' || !h.lesson) continue;
            const l = h.lesson as Lesson;
            if (seen.has(l._id)) continue;
            seen.add(l._id);
            incomplete.push({ lesson: l, completedPercent: h.completedPercent });
            if (incomplete.length >= 4) break;
          }
          setContinueWatching(incomplete);
        })
        .catch(() => {});
    }
  }, [params, router]);

  const fetchLessons = useCallback(async (pageNum: number, format: VideoFormat | null, searchTerm: string, tag: string | null, append = false) => {
    try {
      const res = await lessonsApi.list({
        grade,
        limit: String(PAGE_SIZE),
        page: String(pageNum),
        ...(format ? { format } : {}),
        ...(searchTerm ? { title: searchTerm } : {}),
        ...(tag ? { tags: tag } : {}),
      }) as { data: Lesson[]; pagination: { pages: number; total: number } };
      setLessons(prev => append ? [...prev, ...res.data] : res.data);
      setHasMore(pageNum < res.pagination.pages);
    } catch {
      // show empty state
    }
  }, [grade]);

  // Reset on grade/format/search/tag change
  useEffect(() => {
    setPage(1);
    setLoading(true);
    Promise.all([
      fetchLessons(1, activeFormat, search, tagFilter, false),
      !search && !tagFilter ? compilationsApi.list(grade).then((r: unknown) =>
        setCompilations((r as { data: ThemedCompilation[] }).data)
      ).catch(() => {}) : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [grade, activeFormat, search, tagFilter, fetchLessons]);

  async function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    await fetchLessons(next, activeFormat, search, tagFilter, true);
    setPage(next);
    setLoadingMore(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setActiveFormat(null);
    setTagFilter(null);
  }

  function selectFormat(fmt: VideoFormat | null) {
    setActiveFormat(fmt);
    setTagFilter(null);
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl" style={{ color: colors.primary }}>LittleLearners</Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard?grade=${grade === 'LKG' ? 'UKG' : 'LKG'}`}
            className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-colors"
            style={{ borderColor: colors.primary, color: colors.primary }}>
            {grade === 'LKG' ? '🦋 Switch to UKG' : '🐣 Switch to LKG'}
          </Link>
          {childId ? (
            <Link href={`/profile/${childId}`}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-white transition-colors"
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

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Child stats bar */}
        {childInfo && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-white rounded-2xl card-shadow-sm">
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
            <div className="flex items-center gap-2 text-center">
              <div>
                <div className="text-base font-bold" style={{ color: colors.primary }}>{childInfo.streak}🔥</div>
                <div className="text-xs text-gray-400">streak</div>
              </div>
              <div className="w-px h-6 bg-gray-100" />
              <div>
                <div className="text-base font-bold text-yellow-500">⭐{childInfo.xp}</div>
                <div className="text-xs text-gray-400">XP</div>
              </div>
              <div className="w-px h-6 bg-gray-100" />
              <div>
                <div className="text-base font-bold text-amber-500">🪙{childInfo.coins}</div>
                <div className="text-xs text-gray-400">coins</div>
              </div>
            </div>
          </div>
        )}

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            ref={searchInputRef}
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search for a lesson…"
            className="flex-1 bg-white border-2 border-gray-100 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none transition-colors"
            style={{ '--tw-ring-color': colors.primary } as React.CSSProperties}
            onFocus={e => { e.currentTarget.style.borderColor = colors.primary; }}
            onBlur={e => { e.currentTarget.style.borderColor = ''; }}
          />
          <button type="submit"
            className="px-5 py-2.5 rounded-2xl text-white text-sm font-bold transition-colors"
            style={{ backgroundColor: colors.primary }}>
            🔍
          </button>
          {search && (
            <button type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-2xl text-sm font-bold hover:bg-gray-200 transition-colors">
              ✕
            </button>
          )}
        </form>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          <button
            onClick={() => selectFormat(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-bold text-sm transition-all ${!activeFormat ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
            style={!activeFormat ? { backgroundColor: colors.primary } : {}}>
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.format}
              onClick={() => selectFormat(activeFormat === c.format ? null : c.format)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all ${activeFormat === c.format ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
              style={activeFormat === c.format ? { backgroundColor: colors.primary } : {}}>
              <span>{c.emoji}</span>{c.label}
            </button>
          ))}
        </div>

        {/* Continue Watching */}
        {!activeFormat && !search && continueWatching.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl mb-4" style={{ color: colors.primary }}>▶ Continue Learning</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {continueWatching.map(({ lesson, completedPercent }) => (
                <Link key={lesson._id} href={`/watch/${lesson._id}`} className="flex-shrink-0 w-44">
                  <div className="bg-white rounded-2xl overflow-hidden card-shadow hover:scale-105 transition-transform">
                    <div className="h-24 flex items-center justify-center text-3xl relative overflow-hidden"
                      style={{ backgroundColor: colors.secondary + '22' }}>
                      {lesson.thumbnailUrl ? (
                        <img src={lesson.thumbnailUrl} alt={lesson.title} className="w-full h-full object-cover absolute inset-0" />
                      ) : null}
                      <span className={lesson.thumbnailUrl ? 'relative z-10' : ''}>{VIDEO_FORMAT_ICONS[lesson.videoFormat]}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-gray-100">
                      <div className="h-1 transition-all" style={{ width: `${completedPercent}%`, backgroundColor: colors.primary }} />
                    </div>
                    <div className="p-2.5">
                      <p className="font-bold text-gray-800 text-xs leading-tight line-clamp-2">{lesson.title}</p>
                      <p className="text-xs mt-1" style={{ color: colors.primary }}>{completedPercent}% watched</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Compilations */}
        {!activeFormat && !search && compilations.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl mb-4" style={{ color: colors.primary }}>🎶 Playlists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {compilations.map(comp => {
                const firstLesson = comp.lessons[0] as Lesson | undefined;
                const thumb = firstLesson?.thumbnailUrl;
                return (
                  <Link key={comp._id} href={`/playlist/${comp._id}`}>
                    <div className="bg-white rounded-3xl overflow-hidden card-shadow hover:scale-105 transition-transform">
                      <div className="h-28 flex items-center justify-center text-5xl relative overflow-hidden"
                        style={{ backgroundColor: colors.secondary + '33' }}>
                        {thumb ? (
                          <img src={thumb} alt={comp.title} className="w-full h-full object-cover absolute inset-0" />
                        ) : null}
                        <span className={thumb ? 'relative z-10 bg-black/40 rounded-full p-1.5 text-2xl' : ''}>📋</span>
                      </div>
                      <div className="p-3">
                        <p className="font-bold text-gray-800 text-sm leading-tight">{comp.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{comp.lessons.length} videos</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Lessons grid */}
        <section>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h2 className="text-2xl" style={{ color: colors.primary }}>
              {search
                ? `🔍 Results for "${search}"`
                : tagFilter
                  ? `🏷 #${tagFilter}`
                  : activeFormat
                    ? `${VIDEO_FORMAT_ICONS[activeFormat]} ${VIDEO_FORMAT_LABELS[activeFormat]}`
                    : '📚 All Lessons'}
            </h2>
            {tagFilter && (
              <button onClick={() => setTagFilter(null)}
                className="px-3 py-1 bg-white rounded-full text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors"
                style={{ color: colors.primary }}>
                ✕ Clear tag
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                  <div className="h-28 bg-gray-100" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-lg font-semibold">Lessons coming soon!</p>
              <p className="text-sm mt-1">Check back after your teacher creates some lessons.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {lessons.map(lesson => {
                  const watched = watchedIds.has(lesson._id);
                  return (
                    <Link key={lesson._id} href={`/watch/${lesson._id}`}>
                      <div className="bg-white rounded-3xl overflow-hidden card-shadow hover:scale-105 transition-transform cursor-pointer"
                        style={watched ? { outline: `2px solid ${colors.primary}`, outlineOffset: '2px' } : {}}>
                        <div className="h-28 flex items-center justify-center text-5xl relative overflow-hidden" style={{ backgroundColor: colors.secondary + '22' }}>
                          {lesson.thumbnailUrl ? (
                            <img src={lesson.thumbnailUrl} alt={lesson.title} className="w-full h-full object-cover absolute inset-0" />
                          ) : null}
                          <span className={lesson.thumbnailUrl ? 'relative z-10 bg-black/30 rounded-full p-1' : ''}>
                            {VIDEO_FORMAT_ICONS[lesson.videoFormat]}
                          </span>
                          {lesson.durationSeconds && (
                            <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-md z-10">
                              {formatDuration(lesson.durationSeconds)}
                            </span>
                          )}
                          {watched && (
                            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full z-10 font-bold">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{lesson.title}</p>
                          <p className="text-xs mt-1 font-semibold" style={{ color: colors.primary }}>
                            {VIDEO_FORMAT_LABELS[lesson.videoFormat]}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 rounded-3xl font-bold text-white transition-colors disabled:opacity-60"
                    style={{ backgroundColor: colors.primary }}>
                    {loadingMore ? '⏳ Loading…' : '▼ Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
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
