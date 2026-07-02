'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Grade, VideoFormat, Subject, Lesson } from '@/types';
import { VIDEO_FORMAT_LABELS, VIDEO_FORMAT_ICONS } from '@/types';
import { lessonsApi, videoApi, subjectsApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

const GRADES: Grade[] = ['LKG', 'UKG'];

const ALL_FORMATS: VideoFormat[] = [
  'sing_along', 'phonics_song', 'number_song', 'moral_story', 'bedtime_story',
  'action_dance', 'yoga_stretch', 'good_habits', 'festival_special',
  'point_and_learn', 'emotion_song', 'original_song', 'recap_song',
  'celebration_video', 'themed_compilation',
];

const EMPTY = { title: '', grade: 'LKG' as Grade, videoFormat: 'sing_along' as VideoFormat, subject: '', scriptText: '', tags: '' };

interface StatsData {
  byStatus: Record<string, number>;
  totalViews: number;
  topLessons: Pick<Lesson, '_id' | 'title' | 'videoFormat' | 'grade' | 'viewCount'>[];
}

export default function StudioPage() {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [createdId, setCreatedId] = useState('');
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    subjectsApi.list()
      .then((res: unknown) => {
        const list = (res as { data: Subject[] }).data;
        setSubjects(list);
        if (list.length > 0 && !form.subject) {
          setForm(f => ({ ...f, subject: list[0]._id }));
        }
      })
      .catch(() => {});
    lessonsApi.stats()
      .then((res: unknown) => setStats((res as { data: StatsData }).data))
      .catch(() => {});
    lessonsApi.tags()
      .then((res: unknown) => setAllTags((res as { data: string[] }).data))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-filter subjects when grade changes; reset if current subject no longer applies
  const filteredSubjects = subjects.filter(s => !s.grades || s.grades.includes(form.grade));

  useEffect(() => {
    if (filteredSubjects.length > 0 && !filteredSubjects.find(s => s._id === form.subject)) {
      setForm(f => ({ ...f, subject: filteredSubjects[0]._id }));
    }
  }, [form.grade]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast('Title is required', 'warning'); return; }
    if (!form.subject) { toast('Please select a subject / pillar', 'warning'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        grade: form.grade,
        videoFormat: form.videoFormat,
        scriptText: form.scriptText,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        ...(form.subject ? { subject: form.subject } : {}),
      };
      const res = await lessonsApi.create(payload) as { data: { _id: string } };
      const newId = res.data._id;
      setCreatedId(newId);

      if (form.scriptText.trim()) {
        toast('Lesson created — queuing video generation…', 'info');
        await videoApi.generate(newId);
        toast('Video generation queued ✨');
      } else {
        toast('Draft saved!');
      }
      setStep('done');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'done') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-7xl">🎉</div>
      <h2 className="text-3xl text-brand-pink">Lesson Created!</h2>
      <p className="text-gray-500 font-body max-w-sm">
        {form.scriptText ? "Video generation is queued — check the lesson to see when it's ready." : 'Draft saved. Add a script to generate the video.'}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={() => { setForm(EMPTY); setStep('form'); setCreatedId(''); }}
          className="px-6 py-3 bg-brand-pink text-white rounded-2xl font-bold hover:bg-pink-600 transition-colors">
          + New Lesson
        </button>
        <Link href={`/studio/lessons/${createdId}`}
          className="px-6 py-3 border-2 border-brand-pink text-brand-pink rounded-2xl font-bold hover:bg-pink-50 transition-colors">
          Edit Lesson
        </Link>
        <Link href="/studio/lessons"
          className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
          All Lessons
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Stats snapshot */}
        {stats && (
          <div className="mb-8 grid grid-cols-4 gap-3">
            {[
              { label: 'Published', value: stats.byStatus.published ?? 0, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Ready', value: stats.byStatus.ready ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Drafts', value: stats.byStatus.draft ?? 0, color: 'text-gray-600', bg: 'bg-gray-100' },
              { label: 'Total Views', value: stats.totalViews, color: 'text-brand-pink', bg: 'bg-pink-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
                <div className={`text-2xl font-display ${s.color}`}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Top lessons */}
        {stats?.topLessons && stats.topLessons.length > 0 && (
          <div className="mb-8 bg-white rounded-3xl p-5 card-shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700">Top Videos</h2>
              <Link href="/studio/lessons?status=published" className="text-xs text-brand-pink hover:underline">All →</Link>
            </div>
            <div className="space-y-2">
              {stats.topLessons.map((l, i) => (
                <Link key={l._id} href={`/studio/lessons/${l._id}`}>
                  <div className="flex items-center gap-3 py-1.5 hover:bg-gray-50 rounded-xl px-1 transition-colors">
                    <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                    <span className="text-base">{VIDEO_FORMAT_ICONS[l.videoFormat]}</span>
                    <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{l.title}</span>
                    <span className="text-xs text-gray-400">👁 {l.viewCount}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl text-gray-800">Create Lesson</h1>
          <Link href="/studio/lessons" className="text-sm text-gray-400 hover:text-brand-pink transition-colors">
            All lessons →
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 card-shadow space-y-6">
          {/* Grade */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
            <div className="flex gap-3">
              {GRADES.map(g => (
                <button type="button" key={g}
                  onClick={() => setForm(f => ({ ...f, grade: g, subject: '' }))}
                  className={`flex-1 py-3 rounded-2xl font-bold transition-all ${form.grade === g ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  style={form.grade === g ? { backgroundColor: g === 'LKG' ? '#FF6B9D' : '#7C3AED' } : {}}>
                  {g === 'LKG' ? '🐣 LKG' : '🦋 UKG'}
                </button>
              ))}
            </div>
          </div>

          {/* Video Format */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Video Format</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {ALL_FORMATS.map(fmt => (
                <button
                  type="button" key={fmt}
                  onClick={() => setForm(f => ({ ...f, videoFormat: fmt }))}
                  title={VIDEO_FORMAT_LABELS[fmt]}
                  className={`flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-semibold transition-all border-2 ${form.videoFormat === fmt ? 'border-brand-pink bg-pink-50 text-brand-pink' : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                  <span className="text-xl">{VIDEO_FORMAT_ICONS[fmt]}</span>
                  <span className="leading-tight text-center" style={{ fontSize: '10px' }}>
                    {VIDEO_FORMAT_LABELS[fmt].split(' ').slice(0, 2).join(' ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          {filteredSubjects.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Subject / Pillar</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, subject: '' }))}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${!form.subject ? 'border-brand-pink text-brand-pink bg-pink-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  Any
                </button>
                {filteredSubjects.map(s => (
                  <button
                    type="button" key={s._id}
                    onClick={() => setForm(f => ({ ...f, subject: s._id }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${form.subject === s._id ? 'border-brand-pink text-brand-pink bg-pink-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <span>{s.icon}</span> {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Lesson Title</label>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. The Crow and the Fox"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
            />
          </div>

          {/* Script */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Script / Lyrics
              <span className="font-normal text-gray-400 ml-1 text-xs">(required for video generation)</span>
            </label>
            <textarea
              rows={7}
              value={form.scriptText}
              onChange={e => setForm(f => ({ ...f, scriptText: e.target.value }))}
              placeholder="Write the script, lyrics, or story here…"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors resize-none leading-relaxed"
            />
            {form.scriptText && (
              <p className="text-xs text-gray-400 mt-1">
                {form.scriptText.length} chars · ~{Math.round(form.scriptText.length / 150)} min read
              </p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Tags <span className="font-normal text-gray-400 text-xs">(comma-separated — same tag on 4+ lessons triggers a compilation)</span>
            </label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="animals, friendship, sharing"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
            />
            {allTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400">Existing tags:</span>
                {allTags.slice(0, 16).map(t => {
                  const currentTags = form.tags.split(',').map(s => s.trim()).filter(Boolean);
                  const isAdded = currentTags.includes(t);
                  return (
                    <button key={t} type="button"
                      onClick={() => {
                        const tags = form.tags.split(',').map(s => s.trim()).filter(Boolean);
                        if (!tags.includes(t)) {
                          setForm(f => ({ ...f, tags: [...tags, t].join(', ') }));
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full text-xs transition-colors ${isAdded ? 'bg-pink-100 text-brand-pink' : 'bg-gray-100 text-gray-500 hover:bg-pink-50 hover:text-brand-pink'}`}>
                      #{t}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-brand-pink text-white rounded-2xl font-bold text-lg hover:bg-pink-600 transition-colors disabled:opacity-50 card-shadow-sm">
            {saving ? '⏳ Creating…' : form.scriptText.trim() ? '✨ Create & Queue Video' : '💾 Save Draft'}
          </button>
        </form>
      </div>
    </div>
  );
}
