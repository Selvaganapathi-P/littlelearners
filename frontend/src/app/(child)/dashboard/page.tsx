'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Grade, Lesson, ThemedCompilation, VideoFormat } from '@/types';
import { VIDEO_FORMAT_ICONS, VIDEO_FORMAT_LABELS } from '@/types';
import { lessonsApi, compilationsApi } from '@/lib/api';
import { formatDuration, getGradeColor } from '@/lib/utils';

const CATEGORIES: { label: string; format: VideoFormat; emoji: string }[] = [
  { label: 'Rhymes', format: 'sing_along', emoji: '🎤' },
  { label: 'Phonics', format: 'phonics_song', emoji: '🔤' },
  { label: 'Numbers', format: 'number_song', emoji: '🔢' },
  { label: 'Stories', format: 'moral_story', emoji: '📖' },
  { label: 'Dance', format: 'action_dance', emoji: '💃' },
  { label: 'Habits', format: 'good_habits', emoji: '✨' },
];

function DashboardContent() {
  const params = useSearchParams();
  const grade = (params.get('grade') || 'LKG') as Grade;
  const colors = getGradeColor(grade);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [compilations, setCompilations] = useState<ThemedCompilation[]>([]);
  const [activeFormat, setActiveFormat] = useState<VideoFormat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lRes, cRes] = await Promise.all([
          lessonsApi.list({ grade, ...(activeFormat ? { format: activeFormat } : {}) }) as Promise<{ data: Lesson[] }>,
          compilationsApi.list(grade) as Promise<{ data: ThemedCompilation[] }>,
        ]);
        setLessons(lRes.data);
        setCompilations(cRes.data);
      } catch {
        // Show empty state on error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [grade, activeFormat]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl" style={{ color: colors.primary }}>LittleLearners</Link>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-white text-sm font-bold" style={{ backgroundColor: colors.primary }}>
            {grade}
          </span>
          <Link href={`/dashboard?grade=${grade === 'LKG' ? 'UKG' : 'LKG'}`}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            Switch to {grade === 'LKG' ? 'UKG' : 'LKG'}
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Category pills */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          <button
            onClick={() => setActiveFormat(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm transition-all ${!activeFormat ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
            style={!activeFormat ? { backgroundColor: colors.primary } : {}}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.format}
              onClick={() => setActiveFormat(activeFormat === c.format ? null : c.format)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${activeFormat === c.format ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
              style={activeFormat === c.format ? { backgroundColor: colors.primary } : {}}
            >
              <span>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>

        {/* Compilations */}
        {!activeFormat && compilations.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl mb-4" style={{ color: colors.primary }}>Playlists</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {compilations.map(comp => (
                <Link key={comp._id} href={`/playlist/${comp._id}`}>
                  <div className="bg-white rounded-3xl overflow-hidden card-shadow hover:scale-105 transition-transform">
                    <div className="h-28 flex items-center justify-center text-5xl" style={{ backgroundColor: colors.secondary + '33' }}>
                      📋
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-800 text-sm leading-tight">{comp.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{comp.lessons.length} videos</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Lessons grid */}
        <section>
          <h2 className="text-2xl mb-4" style={{ color: colors.primary }}>
            {activeFormat ? VIDEO_FORMAT_LABELS[activeFormat] : 'All Videos'}
          </h2>
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
              <div className="text-6xl mb-4">🎬</div>
              <p className="text-lg font-semibold">Videos coming soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {lessons.map(lesson => (
                <Link key={lesson._id} href={`/watch/${lesson._id}`}>
                  <div className="bg-white rounded-3xl overflow-hidden card-shadow hover:scale-105 transition-transform cursor-pointer">
                    <div className="h-28 flex items-center justify-center text-5xl relative" style={{ backgroundColor: colors.secondary + '22' }}>
                      {VIDEO_FORMAT_ICONS[lesson.videoFormat]}
                      {lesson.durationSeconds && (
                        <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                          {formatDuration(lesson.durationSeconds)}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-800 text-sm leading-tight line-clamp-2">{lesson.title}</p>
                      <p className="text-xs mt-1" style={{ color: colors.primary }}>{VIDEO_FORMAT_LABELS[lesson.videoFormat]}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-4xl animate-bounce">🌟</div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
