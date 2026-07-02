import { cn } from '@/lib/utils';
import type { VideoFormat } from '@/types';
import { VIDEO_FORMAT_ICONS, VIDEO_FORMAT_LABELS } from '@/types';

export function FormatBadge({ format, className }: { format: VideoFormat; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-50 text-brand-pink', className)}>
      {VIDEO_FORMAT_ICONS[format]} {VIDEO_FORMAT_LABELS[format]}
    </span>
  );
}
