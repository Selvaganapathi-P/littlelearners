'use client';

import { useState } from 'react';
import type { Grade, VideoFormat } from '@/types';
import { VIDEO_FORMAT_LABELS, VIDEO_FORMAT_ICONS } from '@/types';
import { lessonsApi, videoApi } from '@/lib/api';

const GRADES: Grade[] = ['LKG', 'UKG'];

const ALL_FORMATS: VideoFormat[] = [
  'sing_along', 'phonics_song', 'number_song', 'moral_story', 'bedtime_story',
  'action_dance', 'yoga_stretch', 'good_habits', 'festival_special',
  'point_and_learn', 'emotion_song', 'original_song', 'recap_song',
  'celebration_video', 'themed_compilation',
];

const EMPTY_FORM = { title: '', grade: 'LKG' as Grade, videoFormat: 'sing_along' as VideoFormat, scriptText: '', tags: '' };

export default function StudioPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState<'form' | 'generating' | 'done'>('form');
  const [createdId, setCreatedId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await lessonsApi.create({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        subject: undefined,
      }) as { data: { _id: string } };
      setCreatedId(res.data._id);
      if (form.scriptText) {
        setStep('generating');
        await videoApi.generate(res.data._id);
        setStep('done');
      } else {
        setStep('done');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('form');
    }
  };

  if (step === 'generating') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <div className="text-6xl animate-spin">⚙️</div>
      <p className="text-xl font-body font-bold text-gray-700">Generating video…</p>
      <p className="text-sm text-gray-400">This may take a few minutes</p>
    </div>
  );

  if (step === 'done') return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-7xl">🎉</div>
      <h2 className="text-3xl text-brand-pink">Lesson Created!</h2>
      <p className="text-gray-600 font-body">
        {form.scriptText ? 'Video generation has been queued.' : 'Draft saved. Add a script to generate video.'}
      </p>
      <div className="flex gap-3">
        <button onClick={() => { setForm(EMPTY_FORM); setStep('form'); setCreatedId(''); }}
          className="px-6 py-3 bg-brand-pink text-white rounded-2xl font-bold hover:bg-pink-600 transition-colors">
          Create Another
        </button>
        <a href={`/watch/${createdId}`}
          className="px-6 py-3 border-2 border-brand-pink text-brand-pink rounded-2xl font-bold hover:bg-pink-50 transition-colors">
          View Lesson
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl text-brand-pink">Staff Studio</h1>
        <a href="/calendar" className="text-sm text-gray-500 hover:text-brand-pink transition-colors">Content Calendar →</a>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 card-shadow space-y-6">
          <h2 className="text-xl font-bold text-gray-800">Create New Lesson</h2>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">{error}</div>}

          {/* Grade */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Grade</label>
            <div className="flex gap-3">
              {GRADES.map(g => (
                <button type="button" key={g} onClick={() => setForm(f => ({ ...f, grade: g }))}
                  className={`flex-1 py-3 rounded-2xl font-bold transition-all ${form.grade === g ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  style={form.grade === g ? { backgroundColor: g === 'LKG' ? '#FF6B9D' : '#7C3AED' } : {}}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Video Format */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Video Format</label>
            <select
              value={form.videoFormat}
              onChange={e => setForm(f => ({ ...f, videoFormat: e.target.value as VideoFormat }))}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
            >
              {ALL_FORMATS.map(fmt => (
                <option key={fmt} value={fmt}>
                  {VIDEO_FORMAT_ICONS[fmt]} {VIDEO_FORMAT_LABELS[fmt]}
                </option>
              ))}
            </select>
          </div>

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
              <span className="font-normal text-gray-400 ml-1">(required for video generation)</span>
            </label>
            <textarea
              rows={6}
              value={form.scriptText}
              onChange={e => setForm(f => ({ ...f, scriptText: e.target.value }))}
              placeholder="Write the script, lyrics, or story here…"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tags <span className="font-normal text-gray-400">(comma-separated)</span></label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="animals, friendship, sharing"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors"
            />
          </div>

          <button type="submit"
            className="w-full py-4 bg-brand-pink text-white rounded-2xl font-bold text-lg hover:bg-pink-600 transition-colors card-shadow-sm">
            {form.scriptText ? '✨ Create & Generate Video' : 'Save Draft'}
          </button>
        </form>
      </div>
    </div>
  );
}
