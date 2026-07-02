'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ThemedCompilation } from '@/types';
import { VIDEO_FORMAT_ICONS, VIDEO_FORMAT_LABELS } from '@/types';
import { compilationsApi } from '@/lib/api';
import { formatDuration } from '@/lib/utils';

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<ThemedCompilation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    compilationsApi.get(id)
      .then((res: unknown) => setPlaylist((res as { data: ThemedCompilation }).data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50">
      <div className="text-6xl animate-bounce">📋</div>
    </div>
  );

  if (!playlist) return null;

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-pink to-brand-orange px-6 py-10 text-white">
        <button onClick={() => router.back()} className="text-white/70 hover:text-white mb-4 text-sm flex items-center gap-1 transition-colors">
          ← Back
        </button>
        <div className="text-5xl mb-3">📋</div>
        <h1 className="text-3xl mb-1">{playlist.title}</h1>
        <p className="text-white/80 font-body text-sm">{playlist.lessons.length} videos</p>
      </div>

      {/* Lesson list */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
        {playlist.lessons.map((lesson, index) => (
          <Link key={lesson._id} href={`/watch/${lesson._id}`}>
            <div className="bg-white rounded-3xl p-4 card-shadow hover:scale-[1.02] transition-transform flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-pink-50 flex-shrink-0">
                {VIDEO_FORMAT_ICONS[lesson.videoFormat]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{lesson.title}</p>
                <p className="text-xs text-brand-pink mt-0.5">{VIDEO_FORMAT_LABELS[lesson.videoFormat]}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-xs text-gray-400 font-body bg-gray-50 px-2 py-1 rounded-full">
                  #{index + 1}
                </span>
                {lesson.durationSeconds && (
                  <p className="text-xs text-gray-400 mt-1">{formatDuration(lesson.durationSeconds)}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
