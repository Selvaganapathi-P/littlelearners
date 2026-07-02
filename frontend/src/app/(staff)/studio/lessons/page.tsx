'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { Lesson, VideoFormat, Grade } from '@/types';
import { VIDEO_FORMAT_LABELS } from '@/types';
import { LessonCard } from '@/components/ui/LessonCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { lessonsApi, videoApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const GRADE_OPTIONS: Array<Grade | 'all'> = ['all', 'LKG', 'UKG'];
const STATUS_OPTIONS = ['all', 'draft', 'generating', 'ready', 'published', 'archived'] as const;

export default function LessonsManagePage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [gradeFilter, setGradeFilter] = useState<Grade | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (gradeFilter !== 'all') params.grade = gradeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      else params.status = '';
      const res = await lessonsApi.list(params) as { data: Lesson[]; pagination: { total: number } };
      setLessons(res.data);
      setTotal(res.pagination.total);
    } finally {
      setLoading(false);
    }
  }, [page, gradeFilter, statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const publish = async (id: string) => {
    setActionLoading(id + '_publish');
    try {
      await lessonsApi.publish(id);
      await fetch();
    } finally { setActionLoading(null); }
  };

  const generateVideo = async (id: string) => {
    setActionLoading(id + '_gen');
    try {
      await videoApi.generate(id);
      await fetch();
    } finally { setActionLoading(null); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display text-gray-800">Lessons</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total</p>
        </div>
        <Link href="/studio"
          className="px-4 py-2 bg-brand-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 transition-colors">
          + New Lesson
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100">
          {GRADE_OPTIONS.map(g => (
            <button key={g} onClick={() => { setGradeFilter(g); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${gradeFilter === g ? 'bg-brand-pink text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {g === 'all' ? 'All Grades' : g}
            </button>
          ))}
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold text-gray-600 focus:border-brand-pink outline-none bg-white">
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 ml-auto">
          {(['table', 'grid'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === v ? 'bg-gray-100 text-gray-800' : 'text-gray-400'}`}>
              {v === 'table' ? '☰' : '⊞'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-300 text-5xl animate-pulse">🎬</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-gray-500 font-semibold">No lessons yet.</p>
          <Link href="/studio" className="text-brand-pink hover:underline text-sm mt-2 inline-block">Create the first one →</Link>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {lessons.map(l => <LessonCard key={l._id} lesson={l} mode="staff" />)}
        </div>
      ) : (
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 card-shadow">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-500 font-semibold">Title</th>
                <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden sm:table-cell">Format</th>
                <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden md:table-cell">Grade</th>
                <th className="text-left px-4 py-3 text-gray-500 font-semibold">Status</th>
                <th className="text-left px-4 py-3 text-gray-500 font-semibold hidden lg:table-cell">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lessons.map(lesson => (
                <tr key={lesson._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-800 max-w-[200px] truncate">{lesson.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                    {VIDEO_FORMAT_LABELS[lesson.videoFormat as VideoFormat]}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lesson.grade === 'LKG' ? 'bg-pink-50 text-brand-pink' : 'bg-purple-50 text-brand-purple'}`}>
                      {lesson.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={lesson.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDate(lesson.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      {lesson.status === 'draft' && lesson.scriptText && (
                        <button onClick={() => generateVideo(lesson._id)}
                          disabled={actionLoading === lesson._id + '_gen'}
                          className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-100 transition-colors disabled:opacity-50">
                          {actionLoading === lesson._id + '_gen' ? '…' : '⚙️ Generate'}
                        </button>
                      )}
                      {lesson.status === 'ready' && (
                        <button onClick={() => publish(lesson._id)}
                          disabled={actionLoading === lesson._id + '_publish'}
                          className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50">
                          {actionLoading === lesson._id + '_publish' ? '…' : '✅ Publish'}
                        </button>
                      )}
                      <Link href={`/watch/${lesson._id}`}
                        className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {total > 20 && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Page {page} of {Math.ceil(total / 20)}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1 text-xs bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition-colors">← Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
                  className="px-3 py-1 text-xs bg-gray-100 rounded-lg disabled:opacity-40 hover:bg-gray-200 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
