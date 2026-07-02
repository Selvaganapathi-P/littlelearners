'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Lesson } from '@/types';
import { VIDEO_FORMAT_LABELS, VIDEO_FORMAT_ICONS } from '@/types';
import { lessonsApi } from '@/lib/api';
import { formatDuration, getGradeColor } from '@/lib/utils';

export default function WatchPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lessonsApi.get(lessonId)
      .then((res: unknown) => setLesson((res as { data: Lesson }).data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [lessonId, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-6xl animate-bounce">🌟</div>
    </div>
  );

  if (!lesson) return null;

  const colors = getGradeColor(lesson.grade);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Video player area */}
      <div className="relative bg-black w-full" style={{ aspectRatio: '16/9', maxHeight: '70vh' }}>
        {lesson.videoUrl ? (
          <video
            className="w-full h-full object-contain"
            src={lesson.videoUrl}
            controls
            autoPlay
            playsInline
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="text-8xl">{VIDEO_FORMAT_ICONS[lesson.videoFormat]}</div>
            <p className="text-white/60 font-body">Video generating…</p>
          </div>
        )}

        {/* Back button overlay */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg hover:bg-black/70 transition-colors"
          aria-label="Go back"
        >
          ←
        </button>
      </div>

      {/* Meta */}
      <div className="max-w-3xl mx-auto px-4 py-6" style={{ color: 'white' }}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl mb-1">{lesson.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: colors.primary }}>
                {lesson.grade}
              </span>
              <span>{VIDEO_FORMAT_ICONS[lesson.videoFormat]} {VIDEO_FORMAT_LABELS[lesson.videoFormat]}</span>
              {lesson.durationSeconds && <span>· {formatDuration(lesson.durationSeconds)}</span>}
            </div>
          </div>
        </div>

        {/* Tags */}
        {lesson.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {lesson.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <Link href={`/dashboard?grade=${lesson.grade}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
          ← Back to {lesson.grade} videos
        </Link>
      </div>
    </div>
  );
}
