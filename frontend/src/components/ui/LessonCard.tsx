import Link from 'next/link';
import type { Lesson } from '@/types';
import { VIDEO_FORMAT_ICONS, VIDEO_FORMAT_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';

interface LessonCardProps {
  lesson: Lesson;
  mode?: 'child' | 'staff';
  grade?: 'LKG' | 'UKG';
  className?: string;
}

export function LessonCard({ lesson, mode = 'child', grade, className }: LessonCardProps) {
  const gradeColor = (lesson.grade || grade) === 'LKG' ? '#FF6B9D' : '#7C3AED';
  const href = mode === 'staff' ? `/studio/lessons/${lesson._id}` : `/watch/${lesson._id}`;

  return (
    <Link href={href}>
      <div className={cn('bg-white rounded-3xl overflow-hidden card-shadow hover:scale-[1.03] transition-transform cursor-pointer', className)}>
        {/* Thumbnail */}
        <div className="h-28 flex items-center justify-center text-5xl relative" style={{ backgroundColor: gradeColor + '18' }}>
          {VIDEO_FORMAT_ICONS[lesson.videoFormat]}
          {mode === 'staff' && (
            <span className="absolute top-2 right-2">
              <StatusBadge status={lesson.status} />
            </span>
          )}
        </div>
        {/* Info */}
        <div className="p-3">
          <p className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">{lesson.title}</p>
          <p className="text-xs mt-1.5 font-semibold" style={{ color: gradeColor }}>
            {VIDEO_FORMAT_LABELS[lesson.videoFormat]}
          </p>
          {mode === 'staff' && lesson.viewCount !== undefined && (
            <p className="text-xs text-gray-400 mt-0.5">{lesson.viewCount} views</p>
          )}
        </div>
      </div>
    </Link>
  );
}
