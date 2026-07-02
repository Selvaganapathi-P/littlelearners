'use client';

import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Lesson, ThemedCompilation } from '@/types';
import { VIDEO_FORMAT_LABELS, VIDEO_FORMAT_ICONS } from '@/types';
import { lessonsApi, childrenApi, compilationsApi } from '@/lib/api';
import { formatDuration, getGradeColor } from '@/lib/utils';

function WatchContent() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedRef = useRef(false);

  const playlistId = searchParams.get('playlist');
  const playlistIdx = Number(searchParams.get('idx') ?? 0);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [related, setRelated] = useState<Lesson[]>([]);
  const [playlist, setPlaylist] = useState<ThemedCompilation | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrated, setCelebrated] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    recordedRef.current = false;
    setCelebrated(false);
    setCountdown(0);
    setPlaylist(null);

    const lessonReq = lessonsApi.get(lessonId).then((res: unknown) => {
      const data = (res as { data: Lesson }).data;
      setLesson(data);
      lessonsApi.list({ grade: data.grade, format: data.videoFormat, limit: '6' })
        .then((r: unknown) => {
          const all = (r as { data: Lesson[] }).data;
          setRelated(all.filter(l => l._id !== data._id).slice(0, 4));
        })
        .catch(() => {});
      return data;
    });

    const playlistReq = playlistId
      ? compilationsApi.get(playlistId).then((r: unknown) => {
          setPlaylist((r as { data: ThemedCompilation }).data);
        }).catch(() => {})
      : Promise.resolve();

    Promise.all([lessonReq, playlistReq])
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [lessonId, playlistId, router]);

  const nextPlaylistLesson = playlist?.lessons[playlistIdx + 1] ?? null;
  const isLastInPlaylist = playlist ? playlistIdx >= playlist.lessons.length - 1 : false;

  const goToNext = useCallback(() => {
    setCelebrated(false);
    setCountdown(0);
    if (playlist && nextPlaylistLesson) {
      router.push(`/watch/${nextPlaylistLesson._id}?playlist=${playlistId}&idx=${playlistIdx + 1}`);
    } else if (playlist && isLastInPlaylist) {
      router.push(`/playlist/${playlistId}`);
    } else if (related[0]) {
      router.push(`/watch/${related[0]._id}`);
    } else {
      router.push(`/dashboard?grade=${lesson?.grade ?? 'LKG'}`);
    }
  }, [playlist, nextPlaylistLesson, isLastInPlaylist, related, router, lesson, playlistId, playlistIdx]);

  // Auto-play countdown
  useEffect(() => {
    if (!celebrated || countdown <= 0) {
      if (celebrated && countdown === 0) goToNext();
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [celebrated, countdown, goToNext]);

  // Keyboard shortcuts: Space = play/pause, ← = -5s, → = +5s
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const vid = videoRef.current;
      if (!vid) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); vid.paused ? vid.play() : vid.pause(); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); vid.currentTime = Math.max(0, vid.currentTime - 5); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); vid.currentTime = Math.min(vid.duration || 0, vid.currentTime + 5); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function handleShare() {
    if (!lesson) return;
    const url = window.location.href;
    const text = `Watch "${lesson.title}" on LittleLearners! 🌟`;
    if (navigator.share) {
      try { await navigator.share({ title: lesson.title, text, url }); return; } catch {}
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function recordWatch(completedPercent: number) {
    if (recordedRef.current) return;
    const childId = typeof window !== 'undefined' ? localStorage.getItem('ll_child') : null;
    if (!childId) return;
    recordedRef.current = true;
    childrenApi.recordWatch(childId, lessonId, completedPercent)
      .then((res: unknown) => {
        const badges = (res as { newBadges?: { name: string }[] }).newBadges;
        if (badges && badges.length > 0) setNewBadge(badges[0].name);
      })
      .catch(() => {});
  }

  function handleTimeUpdate() {
    const vid = videoRef.current;
    if (!vid || !vid.duration) return;
    const pct = Math.round((vid.currentTime / vid.duration) * 100);
    if (pct >= 80) recordWatch(pct);
  }

  function handleEnded() {
    recordWatch(100);
    setCelebrated(true);
    setCountdown(5);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-6xl animate-bounce">🌟</div>
    </div>
  );

  if (!lesson) return null;

  const colors = getGradeColor(lesson.grade);

  const nextLabel = playlist && nextPlaylistLesson
    ? `▶ Next in Playlist`
    : playlist && isLastInPlaylist
      ? `🎉 Playlist Done!`
      : related[0]
        ? '▶ Next Video'
        : '🏠 Back to Videos';

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Playlist context banner */}
      {playlist && (
        <div className="bg-brand-orange/20 border-b border-brand-orange/30 px-4 py-2 flex items-center justify-between">
          <span className="text-white/80 text-xs font-body">
            📋 {playlist.title} · {playlistIdx + 1} of {playlist.lessons.length}
          </span>
          <Link href={`/playlist/${playlistId}`} className="text-brand-orange text-xs font-semibold hover:underline">
            View playlist →
          </Link>
        </div>
      )}

      {/* Completion celebration overlay */}
      {celebrated && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center px-6">
            <div className="text-8xl mb-4 animate-bounce">
              {isLastInPlaylist ? '🎉' : '🌟'}
            </div>
            <h2 className="text-4xl text-white mb-2" style={{ textShadow: `0 0 20px ${colors.primary}` }}>
              {isLastInPlaylist ? 'Playlist Complete!' : 'Amazing!'}
            </h2>
            <p className="text-white/70 font-body text-lg mb-8">
              {playlist && nextPlaylistLesson
                ? `Up next: ${nextPlaylistLesson.title}`
                : isLastInPlaylist
                  ? `You finished all ${playlist!.lessons.length} videos!`
                  : 'You finished watching!'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={goToNext}
                className="px-6 py-3 rounded-2xl font-bold text-white text-sm transition-colors flex items-center gap-2"
                style={{ backgroundColor: colors.primary }}>
                {nextLabel}
                {countdown > 0 && (
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-white/30 rounded-full text-xs font-bold">
                    {countdown}
                  </span>
                )}
              </button>
              <button
                onClick={() => router.push(`/dashboard?grade=${lesson.grade}`)}
                className="px-6 py-3 bg-white/20 text-white rounded-2xl font-bold text-sm hover:bg-white/30 transition-colors">
                🏠 All Videos
              </button>
              <button
                onClick={() => { setCelebrated(false); setCountdown(0); }}
                className="px-6 py-3 bg-transparent text-white/50 rounded-2xl font-bold text-sm hover:text-white transition-colors">
                ✕ Stay here
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge earned toast */}
      {newBadge && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-gray-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-2xl">🏅</span>
          <div>
            <p className="font-bold text-sm">Badge Earned!</p>
            <p className="text-xs font-semibold">{newBadge}</p>
          </div>
          <button onClick={() => setNewBadge(null)} className="ml-2 text-gray-600 hover:text-gray-900 text-lg leading-none">✕</button>
        </div>
      )}

      {/* Video area */}
      <div className="relative bg-black w-full" style={{ aspectRatio: '16/9', maxHeight: '65vh' }}>
        {lesson.videoUrl ? (
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={lesson.videoUrl}
            controls
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="text-8xl">{VIDEO_FORMAT_ICONS[lesson.videoFormat]}</div>
            <p className="text-white/60 font-body text-sm">Video generating… check back soon!</p>
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-black/70 transition-colors"
          aria-label="Go back"
        >
          ←
        </button>
      </div>

      {/* Meta + related */}
      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h1 className="text-2xl text-white mb-2">{lesson.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-4">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: colors.primary }}>
              {lesson.grade}
            </span>
            <span>{VIDEO_FORMAT_ICONS[lesson.videoFormat]} {VIDEO_FORMAT_LABELS[lesson.videoFormat]}</span>
            {lesson.durationSeconds && <span>· {formatDuration(lesson.durationSeconds)}</span>}
            {lesson.viewCount > 0 && <span>· 👁 {lesson.viewCount}</span>}
          </div>

          {lesson.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {lesson.tags.map(tag => (
                <a key={tag}
                  href={`/dashboard?grade=${lesson.grade}&tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 hover:bg-white/20 hover:text-white transition-colors">
                  #{tag}
                </a>
              ))}
            </div>
          )}

          {/* Share actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors">
              💬 Share
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-gray-300 rounded-xl text-sm font-bold hover:bg-white/20 transition-colors">
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
          </div>

          <Link href={`/dashboard?grade=${lesson.grade}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
            ← All {lesson.grade} videos
          </Link>
        </div>

        {/* Up next column: playlist items OR related */}
        {playlist ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Playlist · {playlistIdx + 1}/{playlist.lessons.length}
            </h2>
            <div className="space-y-2">
              {playlist.lessons.map((pl, i) => {
                const isCurrent = pl._id === lessonId;
                return (
                  <Link key={pl._id} href={`/watch/${pl._id}?playlist=${playlistId}&idx=${i}`}>
                    <div className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${isCurrent ? 'bg-white/15 ring-1 ring-white/30' : 'bg-white/5 hover:bg-white/10'}`}>
                      <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${isCurrent ? 'text-white' : 'text-gray-500'}`}
                        style={isCurrent ? { backgroundColor: colors.primary } : { backgroundColor: '#ffffff10' }}>
                        {isCurrent ? '▶' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold leading-tight truncate ${isCurrent ? 'text-white' : 'text-gray-300'}`}>{pl.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{VIDEO_FORMAT_LABELS[pl.videoFormat]}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : related.length > 0 ? (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Up Next</h2>
            <div className="space-y-3">
              {related.map(r => (
                <Link key={r._id} href={`/watch/${r._id}`}>
                  <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: colors.primary + '30' }}>
                      {VIDEO_FORMAT_ICONS[r.videoFormat]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold leading-tight truncate">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{VIDEO_FORMAT_LABELS[r.videoFormat]}</p>
                    </div>
                    {r.durationSeconds && (
                      <span className="text-xs text-gray-500 flex-shrink-0">{formatDuration(r.durationSeconds)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-6xl animate-bounce">🌟</div>
      </div>
    }>
      <WatchContent />
    </Suspense>
  );
}
