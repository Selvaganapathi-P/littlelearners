import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function getGradeColor(grade: 'LKG' | 'UKG'): { primary: string; secondary: string; bg: string } {
  return grade === 'LKG'
    ? { primary: '#FF6B9D', secondary: '#FFB347', bg: '#FFF5F8' }
    : { primary: '#7C3AED', secondary: '#06B6D4', bg: '#F5F3FF' };
}
