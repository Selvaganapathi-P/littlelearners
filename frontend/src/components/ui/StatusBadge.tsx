import { cn } from '@/lib/utils';
import type { LessonStatus } from '@/types';

const STYLES: Record<LessonStatus, string> = {
  draft:       'bg-gray-100 text-gray-600',
  generating:  'bg-yellow-100 text-yellow-700 animate-pulse',
  ready:       'bg-blue-100 text-blue-700',
  published:   'bg-green-100 text-green-700',
  archived:    'bg-red-100 text-red-600',
};

const LABELS: Record<LessonStatus, string> = {
  draft:      'Draft',
  generating: 'Generating…',
  ready:      'Ready',
  published:  'Published',
  archived:   'Archived',
};

export function StatusBadge({ status, className }: { status: LessonStatus; className?: string }) {
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold', STYLES[status], className)}>
      {LABELS[status]}
    </span>
  );
}
