'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Child } from '@/types';
import { VIDEO_FORMAT_ICONS } from '@/types';
import { api, childrenApi } from '@/lib/api';
import { ChildNav } from '@/components/ChildNav';
import { formatDate, getGradeColor } from '@/lib/utils';

const AVATARS = ['🐣', '🦋', '🐸', '🦁', '🐧', '🦊', '🐨', '🦄', '🐙', '🌈', '⭐', '🌸',
                  '🐱', '🐶', '🐰', '🐻', '🐘', '🦉'];

const NAMED_AVATARS: Record<string, string> = {
  default: '🐣', cat: '🐱', dog: '🐶', rabbit: '🐰',
  bear: '🐻', lion: '🦁', elephant: '🐘', owl: '🦉',
};

function resolveAvatar(avatar: string): string {
  return NAMED_AVATARS[avatar] ?? avatar ?? '🐣';
}

export default function ChildProfilePage() {
  const { childId } = useParams<{ childId: string }>();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ data: Child }>(`/children/${childId}`)
      .then(res => {
        setChild(res.data);
        setEditName(res.data.name);
        setEditAvatar(res.data.avatar);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [childId, router]);

  async function handleSave() {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await childrenApi.update(childId, {
        name: editName.trim(),
        avatar: editAvatar,
      }) as { data: Child };
      setChild(res.data);
      setEditing(false);
    } catch {
      // silent — keep editing open
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center">
      <div className="text-6xl animate-bounce">🌟</div>
    </div>
  );
  if (!child) return null;

  const colors = getGradeColor(child.grade);
  const streakFire = child.streaks.current >= 7 ? '🔥🔥' : child.streaks.current >= 3 ? '🔥' : '⭐';

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: colors.bg }}>
      {/* Hero */}
      <div className="relative overflow-hidden px-4 py-12 text-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 text-white/70 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <button onClick={() => setEditing(true)}
          className="absolute top-4 right-4 text-white/70 hover:text-white text-sm transition-colors px-3 py-1 bg-white/10 rounded-xl">
          ✏️ Edit
        </button>

        <div className="w-28 h-28 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center text-6xl shadow-lg">
          {resolveAvatar(child.avatar)}
        </div>

        <h1 className="text-3xl text-white mb-1">{child.name}</h1>
        <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-white text-sm font-semibold">
          {child.grade}
        </span>

        <div className="mt-6 inline-flex items-center gap-3 bg-white/20 rounded-2xl px-5 py-3">
          <div className="text-center">
            <div className="text-3xl">{streakFire}</div>
            <div className="text-white text-xs mt-1 font-semibold">{child.streaks.current} day streak</div>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{child.streaks.longest}</div>
            <div className="text-white/80 text-xs mt-1">Best streak</div>
          </div>
          <div className="w-px h-10 bg-white/30" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{child.badges.length}</div>
            <div className="text-white/80 text-xs mt-1">Badges</div>
          </div>
        </div>
      </div>

      {/* Edit overlay */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="text-xl font-display text-gray-800 mb-5">Edit Profile</h2>

            <label className="block text-sm font-bold text-gray-700 mb-1.5">Name</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              maxLength={64}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-body focus:border-brand-pink outline-none transition-colors mb-5"
            />

            <label className="block text-sm font-bold text-gray-700 mb-2">Avatar</label>
            <div className="grid grid-cols-6 gap-2 mb-6">
              {AVATARS.map(a => (
                <button key={a} type="button"
                  onClick={() => setEditAvatar(a)}
                  className={`text-2xl py-2 rounded-xl transition-all ${editAvatar === a ? 'bg-pink-100 ring-2 ring-brand-pink scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  {a}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditing(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-2xl text-gray-500 font-bold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving || !editName.trim()}
                className="flex-1 py-3 bg-brand-pink text-white rounded-2xl font-bold disabled:opacity-50 hover:bg-pink-600 transition-colors"
                style={{ backgroundColor: colors.primary }}>
                {saving ? '⏳ Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Badges */}
        <section>
          <h2 className="text-xl font-display mb-4" style={{ color: colors.primary }}>Badges Earned</h2>
          {child.badges.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center text-gray-400 card-shadow-sm">
              <div className="text-4xl mb-2">🏆</div>
              <p className="text-sm">Keep watching to earn badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {child.badges.map((badge, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 text-center card-shadow-sm">
                  <div className="text-3xl mb-1">{VIDEO_FORMAT_ICONS[badge.videoFormat] || '🏅'}</div>
                  <p className="text-xs font-bold text-gray-700 leading-tight">{badge.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(badge.earnedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Watch History */}
        <section>
          <h2 className="text-xl font-display mb-4" style={{ color: colors.primary }}>Recently Watched</h2>
          {child.watchHistory.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center text-gray-400 card-shadow-sm">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm">No videos watched yet.</p>
              <Link href={`/dashboard?grade=${child.grade}`}
                className="text-sm mt-2 inline-block font-semibold" style={{ color: colors.primary }}>
                Start watching →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {[...child.watchHistory].reverse().slice(0, 12).map((entry, i) => {
                const lesson = typeof entry.lesson === 'object' && entry.lesson !== null
                  ? entry.lesson as { _id?: string; title?: string }
                  : null;
                return (
                  <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 card-shadow-sm">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.primary }} />
                    <div className="flex-1 min-w-0">
                      {lesson?._id ? (
                        <Link href={`/watch/${lesson._id}`}
                          className="text-sm font-semibold text-gray-800 truncate hover:underline block"
                          style={{ color: colors.primary }}>
                          {lesson.title ?? 'Lesson'}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-gray-800 truncate">{lesson?.title ?? 'Lesson'}</p>
                      )}
                      <p className="text-xs text-gray-400">{formatDate(entry.watchedAt)}</p>
                    </div>
                    {entry.completedPercent > 0 && (
                      <div className="flex-shrink-0 text-right">
                        <div className="text-xs font-bold text-gray-600">{entry.completedPercent}%</div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1">
                          <div className="h-1.5 rounded-full" style={{ width: `${entry.completedPercent}%`, backgroundColor: colors.primary }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="text-center pb-4">
          <Link href={`/dashboard?grade=${child.grade}`}
            className="inline-block px-8 py-4 text-white rounded-3xl font-bold text-lg card-shadow"
            style={{ backgroundColor: colors.primary }}>
            Watch More Videos 🎬
          </Link>
        </div>
      </div>
      <ChildNav grade={child.grade as 'LKG' | 'UKG'} childId={childId as string} />
    </div>
  );
}
