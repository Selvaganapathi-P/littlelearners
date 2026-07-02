'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { lessonsApi, videoApi, subjectsApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { Lesson, Subject, VIDEO_FORMAT_LABELS, VIDEO_FORMAT_ICONS } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FormatBadge } from '@/components/ui/FormatBadge';

const EMPTY: Partial<Lesson> & { subjectId?: string } = {
  title: '',
  scriptText: '',
  tags: [],
  videoUrl: '',
  thumbnailUrl: '',
  subjectId: '',
};

export default function LessonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState<typeof EMPTY>(EMPTY);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingScript, setGeneratingScript] = useState(false);

  useEffect(() => {
    subjectsApi.list()
      .then((r: unknown) => setSubjects((r as { data: Subject[] }).data))
      .catch(() => {});
    lessonsApi.tags()
      .then((r: unknown) => setAllTags((r as { data: string[] }).data))
      .catch(() => {});
    lessonsApi.get(id)
      .then((res: unknown) => {
        const r = res as { data?: Lesson; lesson?: Lesson };
        const data: Lesson = r.data ?? r.lesson ?? (res as Lesson);
        setLesson(data);
        setForm({
          title: data.title,
          scriptText: data.scriptText || '',
          tags: [...data.tags],
          videoUrl: data.videoUrl || '',
          thumbnailUrl: data.thumbnailUrl || '',
          subjectId: typeof data.subject === 'object' && data.subject !== null
            ? (data.subject as Subject)._id
            : (data.subject as string) || '',
        });
      })
      .catch(() => toast('Failed to load lesson', 'error'))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll every 8s while status is 'generating'
  useEffect(() => {
    if (lesson?.status !== 'generating') return;
    const interval = setInterval(() => {
      lessonsApi.get(id).then((res: unknown) => {
        const r = res as { data?: Lesson };
        const data = r.data ?? (res as Lesson);
        if (data.status !== 'generating') {
          setLesson(data);
          toast(data.status === 'ready' ? '🎉 Video is ready!' : `Status: ${data.status}`, 'success');
          clearInterval(interval);
        }
      }).catch(() => {});
    }, 8000);
    return () => clearInterval(interval);
  }, [lesson?.status, id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!form.title?.trim()) { toast('Title is required', 'warning'); return; }
    setSaving(true);
    try {
      const savePayload = { ...form, ...(form.subjectId ? { subject: form.subjectId } : {}) };
      const res = await lessonsApi.update(id, savePayload) as { data: Lesson };
      const updated = res.data ?? (res as unknown as Lesson);
      setLesson(updated);
      toast('Lesson saved');
    } catch {
      toast('Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      const res = await lessonsApi.publish(id) as { data: Lesson };
      const updated = res.data ?? (res as unknown as Lesson);
      setLesson(updated);
      toast('Lesson published! 🎉');
    } catch {
      toast('Failed to publish', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      await videoApi.generate(id);
      toast('Video generation queued ✨', 'info');
      setLesson(prev => prev ? { ...prev, status: 'generating' } : prev);
    } catch {
      toast('Failed to queue generation', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleGenerateScript() {
    if (!form.title?.trim()) { toast('Add a title first', 'warning'); return; }
    setGeneratingScript(true);
    try {
      const res = await lessonsApi.generateScript(id) as { data: { scriptText: string } };
      setForm(f => ({ ...f, scriptText: res.data.scriptText }));
      toast('✨ Script generated! Review and edit before saving.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate script';
      toast(msg.includes('not configured') ? 'AI script generation not enabled on this server' : 'Generation failed — try again', 'error');
    } finally {
      setGeneratingScript(false);
    }
  }

  async function handleSimulate() {
    setGenerating(true);
    try {
      const res = await videoApi.simulate(id) as { data: Lesson };
      const updated = res.data ?? (res as unknown as Lesson);
      setLesson(updated);
      toast('Simulation complete — video marked ready ⚡', 'success');
    } catch {
      toast('Simulate failed', 'error');
    } finally {
      setGenerating(false);
    }
  }

  async function handleArchive() {
    if (!confirm('Archive this lesson? It will no longer be visible to children.')) return;
    try {
      await lessonsApi.update(id, { status: 'archived' });
      toast('Lesson archived');
      router.push('/studio/lessons');
    } catch {
      toast('Failed to archive', 'error');
    }
  }

  async function handleUnpublish() {
    if (!confirm('Unpublish this lesson? It will no longer be visible to children until re-published.')) return;
    setSaving(true);
    try {
      const res = await lessonsApi.unpublish(id) as { data: Lesson };
      setLesson(res.data ?? (res as unknown as Lesson));
      toast('Lesson unpublished — back to ready');
    } catch {
      toast('Failed to unpublish', 'error');
    } finally {
      setSaving(false);
    }
  }

  const handleClone = useCallback(async () => {
    try {
      const res = await lessonsApi.clone(id) as { data: Lesson };
      const clone = res.data ?? (res as unknown as Lesson);
      toast('Lesson cloned — opening copy');
      router.push(`/studio/lessons/${clone._id}`);
    } catch {
      toast('Failed to clone lesson', 'error');
    }
  }, [id, router, toast]);

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    if (!(form.tags ?? []).includes(tag)) {
      setForm(f => ({ ...f, tags: [...(f.tags ?? []), tag] }));
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm(f => ({ ...f, tags: (f.tags ?? []).filter(t => t !== tag) }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-gray-500 mb-4">Lesson not found.</p>
        <Link href="/studio/lessons" className="text-brand-pink hover:underline">← Back to lessons</Link>
      </div>
    );
  }

  const canPublish = lesson.status === 'ready';
  const canUnpublish = lesson.status === 'published';
  const canGenerate = lesson.status === 'draft' || lesson.status === 'ready';
  const canSimulate = lesson.status === 'generating' || lesson.status === 'draft';
  const isArchived = lesson.status === 'archived';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/studio/lessons" className="hover:text-brand-pink transition-colors">Lessons</Link>
        <span>›</span>
        <span className="text-gray-600">{lesson.title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <StatusBadge status={lesson.status} />
            <span className="text-xs text-gray-400 font-body">
              Grade <strong>{lesson.grade}</strong>
            </span>
            {lesson.viewCount > 0 && (
              <span className="text-xs text-gray-400 font-body">👁 {lesson.viewCount} views</span>
            )}
          </div>
          <FormatBadge format={lesson.videoFormat} />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {canGenerate && (
            <button
              onClick={handleGenerate}
              disabled={generating || isArchived}
              className="px-4 py-2 bg-brand-purple text-white rounded-xl text-sm font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {generating ? '⏳ Queuing…' : `${VIDEO_FORMAT_ICONS[lesson.videoFormat]} Generate`}
            </button>
          )}
          {canSimulate && (
            <button
              onClick={handleSimulate}
              disabled={generating}
              title="Skip Remotion pipeline — mark ready with placeholder video (dev/staging)"
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {generating ? '⏳…' : '⚡ Simulate'}
            </button>
          )}
          {canPublish && (
            <button
              onClick={handlePublish}
              disabled={saving}
              className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '⏳…' : '🚀 Publish'}
            </button>
          )}
          {canUnpublish && (
            <button
              onClick={handleUnpublish}
              disabled={saving}
              className="px-4 py-2 bg-yellow-500 text-white rounded-xl text-sm font-bold hover:bg-yellow-600 disabled:opacity-50 transition-colors"
            >
              {saving ? '⏳…' : '⬇ Unpublish'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || isArchived}
            className="px-4 py-2 bg-brand-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 disabled:opacity-50 transition-colors"
          >
            {saving ? '⏳ Saving…' : '💾 Save'}
          </button>
          <button
            onClick={handleClone}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
          >
            📋 Clone
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main edit area */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-white rounded-3xl p-5 card-shadow">
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              disabled={isArchived}
              className="w-full text-lg font-display text-gray-800 border-0 border-b-2 border-gray-100 focus:border-brand-pink outline-none pb-1 transition-colors bg-transparent"
              placeholder="Lesson title…"
            />
          </div>

          {/* Script */}
          <div className="bg-white rounded-3xl p-5 card-shadow">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-600">Script / Narration</label>
              {!isArchived && (
                <button
                  onClick={handleGenerateScript}
                  disabled={generatingScript || isArchived}
                  title="Generate script with AI (requires OPENAI_API_KEY on server)"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-brand-purple to-brand-pink text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {generatingScript ? (
                    <>
                      <span className="animate-spin inline-block">⏳</span> Generating…
                    </>
                  ) : (
                    <>✨ AI Script</>
                  )}
                </button>
              )}
            </div>
            <textarea
              value={form.scriptText}
              onChange={e => setForm(f => ({ ...f, scriptText: e.target.value }))}
              disabled={isArchived}
              rows={12}
              placeholder="Write the script here — or click ✨ AI Script to generate one automatically…"
              className="w-full text-sm font-body text-gray-700 resize-y border border-gray-100 rounded-xl p-3 focus:border-brand-pink outline-none transition-colors bg-gray-50/50 leading-relaxed"
            />
            <p className="text-xs text-gray-400 mt-1">
              {(form.scriptText ?? '').split(/\s+/).filter(Boolean).length} words · ~{Math.ceil((form.scriptText ?? '').split(/\s+/).filter(Boolean).length / 130)} min video
              {!process.env.NEXT_PUBLIC_HAS_TTS && <span className="ml-2 opacity-50">· TTS audio added automatically when ELEVENLABS_API_KEY is set</span>}
            </p>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-3xl p-5 card-shadow">
            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(form.tags ?? []).map(tag => (
                <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-pink-50 text-brand-pink rounded-full text-xs font-semibold">
                  #{tag}
                  {!isArchived && (
                    <button onClick={() => removeTag(tag)} className="opacity-50 hover:opacity-100">✕</button>
                  )}
                </span>
              ))}
            </div>
            {!isArchived && (
              <>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  placeholder="Add tag, press Enter…"
                  className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:border-brand-pink outline-none w-full"
                />
                {tagInput && allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {allTags
                      .filter(t => t.includes(tagInput.toLowerCase()) && !(form.tags ?? []).includes(t))
                      .slice(0, 8)
                      .map(t => (
                        <button key={t} type="button"
                          onClick={() => {
                            setForm(f => ({ ...f, tags: [...(f.tags ?? []), t] }));
                            setTagInput('');
                          }}
                          className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs hover:bg-pink-50 hover:text-brand-pink transition-colors">
                          #{t}
                        </button>
                      ))}
                  </div>
                )}
              </>
            )}
            <p className="text-xs text-gray-400 mt-1">Tags help the auto-compilation engine group lessons (4+ lessons with the same tag → auto-compilation).</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Video preview */}
          <div className="bg-white rounded-3xl p-5 card-shadow">
            <p className="text-sm font-semibold text-gray-600 mb-3">Video Preview</p>
            {lesson.videoUrl ? (
              <video controls src={lesson.videoUrl} className="w-full rounded-2xl bg-black aspect-video" />
            ) : (
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 flex flex-col items-center justify-center text-gray-300 gap-2">
                <span className="text-4xl">{VIDEO_FORMAT_ICONS[lesson.videoFormat]}</span>
                <span className="text-xs">No video yet</span>
              </div>
            )}
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-semibold text-gray-500">Video URL</label>
              <input
                value={form.videoUrl}
                onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                disabled={isArchived}
                placeholder="https://…"
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 w-full focus:border-brand-pink outline-none"
              />
              <label className="block text-xs font-semibold text-gray-500">Thumbnail URL</label>
              <input
                value={form.thumbnailUrl}
                onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                disabled={isArchived}
                placeholder="https://…"
                className="text-xs border border-gray-200 rounded-xl px-3 py-2 w-full focus:border-brand-pink outline-none"
              />
            </div>
          </div>

          {/* Subject selector */}
          {subjects.length > 0 && !isArchived && (
            <div className="bg-white rounded-3xl p-5 card-shadow">
              <p className="text-sm font-semibold text-gray-600 mb-3">Subject / Pillar</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
                  <button
                    key={s._id}
                    onClick={() => setForm(f => ({ ...f, subjectId: s._id }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.subjectId === s._id ? 'border-brand-pink text-brand-pink bg-pink-50' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    <span>{s.icon}</span>{s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-3xl p-5 card-shadow">
            <p className="text-sm font-semibold text-gray-600 mb-3">Details</p>
            <dl className="space-y-2 text-xs font-body">
              <div className="flex justify-between">
                <dt className="text-gray-400">Format</dt>
                <dd className="text-gray-700 font-semibold">{VIDEO_FORMAT_LABELS[lesson.videoFormat]}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Grade</dt>
                <dd className="text-gray-700 font-semibold">{lesson.grade}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Subject</dt>
                <dd className="text-gray-700 font-semibold">
                  {subjects.find(s => s._id === form.subjectId)?.name ?? lesson.subject?.name ?? '—'}
                </dd>
              </div>
              {lesson.durationSeconds && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Duration</dt>
                  <dd className="text-gray-700 font-semibold">{Math.floor(lesson.durationSeconds / 60)}:{String(lesson.durationSeconds % 60).padStart(2, '0')}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-400">Created</dt>
                <dd className="text-gray-700 font-semibold">{new Date(lesson.createdAt).toLocaleDateString('en-IN')}</dd>
              </div>
              {lesson.publishedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Published</dt>
                  <dd className="text-gray-700 font-semibold">{new Date(lesson.publishedAt).toLocaleDateString('en-IN')}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Danger zone */}
          {!isArchived && (
            <div className="bg-red-50 border border-red-100 rounded-3xl p-4">
              <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wide">Danger Zone</p>
              <button
                onClick={handleArchive}
                className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
              >
                Archive this lesson →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
