'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Lesson, VideoFormat, Grade } from '@/types';
import { VIDEO_FORMAT_LABELS } from '@/types';
import { LessonCard } from '@/components/ui/LessonCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { lessonsApi, videoApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

const GRADE_OPTIONS: Array<Grade | 'all'> = ['all', 'LKG', 'UKG'];
const STATUS_OPTIONS = ['all', 'draft', 'generating', 'ready', 'published', 'archived'] as const;

function LessonsManageContent() {
  const params = useSearchParams();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [gradeFilter, setGradeFilter] = useState<Grade | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>(() => params.get('status') ?? 'all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchLessons = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (gradeFilter !== 'all') params.grade = gradeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      else params.status = 'all';
      if (search) params.title = search;
      const res = await lessonsApi.list(params) as { data: Lesson[]; pagination: { total: number } };
      setLessons(res.data);
      setTotal(res.pagination.total);
      setSelected(new Set());
    } finally {
      setLoading(false);
    }
  }, [page, gradeFilter, statusFilter, search]);

  useEffect(() => { fetchLessons(); }, [fetchLessons]);

  // Auto-refresh every 8s while any lesson is generating
  useEffect(() => {
    const hasGenerating = lessons.some(l => l.status === 'generating');
    if (!hasGenerating) return;
    const t = setInterval(fetchLessons, 8000);
    return () => clearInterval(t);
  }, [lessons, fetchLessons]);

  const publish = async (id: string) => {
    setActionLoading(id + '_publish');
    try {
      await lessonsApi.publish(id);
      await fetchLessons();
    } finally { setActionLoading(null); }
  };

  const generateVideo = async (id: string) => {
    setActionLoading(id + '_gen');
    try {
      await videoApi.generate(id);
      await fetchLessons();
    } finally { setActionLoading(null); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === lessons.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(lessons.map(l => l._id)));
    }
  };

  const bulkAction = async (action: 'publish' | 'archive') => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await lessonsApi.bulkAction([...selected], action) as { modified: number };
      toast(`${res.modified} lesson${res.modified !== 1 ? 's' : ''} ${action === 'publish' ? 'published' : 'archived'} ✅`);
      await fetchLessons();
    } catch {
      toast('Bulk action failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const allSelected = lessons.length > 0 && selected.size === lessons.length;

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

      {/* Search */}
      <form onSubmit={e => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="mb-4">
        <div className="flex gap-2">
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search lessons by title…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:border-brand-pink outline-none bg-white"
          />
          <button type="submit" className="px-4 py-2 bg-brand-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 transition-colors">
            Search
          </button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
              ✕
            </button>
          )}
        </div>
      </form>

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

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl">
          <span className="text-sm font-semibold text-brand-pink">{selected.size} selected</span>
          <button
            onClick={() => bulkAction('publish')}
            disabled={bulkLoading}
            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50">
            {bulkLoading ? '⏳' : '✅ Publish All'}
          </button>
          <button
            onClick={() => bulkAction('archive')}
            disabled={bulkLoading}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
            {bulkLoading ? '⏳' : '🗄 Archive All'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Clear
          </button>
        </div>
      )}

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
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded accent-brand-pink"
                    aria-label="Select all"
                  />
                </th>
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
                <tr key={lesson._id}
                  className={`hover:bg-gray-50 transition-colors ${selected.has(lesson._id) ? 'bg-pink-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(lesson._id)}
                      onChange={() => toggleSelect(lesson._id)}
                      className="rounded accent-brand-pink"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800 max-w-[200px] truncate">{lesson.title}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                    {VIDEO_FORMAT_LABELS[lesson.videoFormat as VideoFormat]}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${lesson.grade === 'LKG' ? 'bg-pink-50 text-brand-pink' : 'bg-purple-50 text-brand-purple'}`}>
                      {lesson.grade}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={lesson.status} />
                      {lesson.status === 'generating' && (
                        <span className="inline-block w-3 h-3 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                      )}
                    </div>
                  </td>
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
                      <Link href={`/studio/lessons/${lesson._id}`}
                        className="px-2.5 py-1 bg-brand-pink/10 text-brand-pink rounded-lg text-xs font-bold hover:bg-brand-pink/20 transition-colors">
                        Edit
                      </Link>
                      <Link href={`/watch/${lesson._id}`}
                        className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                        Watch
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

export default function LessonsManagePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 text-gray-300 text-5xl animate-pulse">🎬</div>
    }>
      <LessonsManageContent />
    </Suspense>
  );
}
