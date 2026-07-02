'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { childrenApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Grade } from '@/types';

const AVATARS = ['🐣', '🦋', '🐸', '🦁', '🐧', '🦊', '🐨', '🦄', '🐙', '🌈', '⭐', '🌸'];

const GRADE_OPTIONS: { grade: Grade; icon: string; label: string; ages: string; color: string; border: string; btn: string }[] = [
  { grade: 'LKG', icon: '🐣', label: 'LKG', ages: 'Ages 3.5 – 4.5', color: 'border-[#FF6B9D]', border: 'ring-[#FF6B9D]', btn: 'bg-[#FF6B9D]' },
  { grade: 'UKG', icon: '🦋', label: 'UKG', ages: 'Ages 4.5 – 5.5', color: 'border-[#7C3AED]', border: 'ring-[#7C3AED]', btn: 'bg-[#7C3AED]' },
];

type Step = 'name' | 'grade' | 'avatar';

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('name');

  // If child profile already exists, skip to dashboard
  useEffect(() => {
    const existing = typeof window !== 'undefined' ? localStorage.getItem('ll_child') : null;
    if (existing) router.replace('/dashboard?grade=LKG');
  }, [router]);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade | null>(null);
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function finish() {
    if (!name.trim() || !grade || !avatar) return;
    setSaving(true);
    setError('');
    try {
      const res = await childrenApi.create({ name: name.trim(), grade: grade!, avatar }) as { data: { _id: string } };
      const childId = res.data._id;
      if (typeof window !== 'undefined') localStorage.setItem('ll_child', childId);
      if (user?.role === 'parent') router.push('/parent');
      else router.push(`/dashboard?grade=${grade}&child=${childId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create profile');
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50 flex flex-col items-center justify-center p-4">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {(['name', 'grade', 'avatar'] as Step[]).map((s, i) => (
          <div key={s} className={`h-2 rounded-full transition-all duration-300 ${step === s ? 'w-8 bg-brand-pink' : i < (['name','grade','avatar'] as Step[]).indexOf(step) ? 'w-2 bg-brand-pink/60' : 'w-2 bg-gray-200'}`} />
        ))}
      </div>

      <div className="w-full max-w-sm bg-white rounded-4xl card-shadow p-8 text-center">

        {/* Step 1: Name */}
        {step === 'name' && (
          <>
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-2xl text-brand-pink mb-2">What&apos;s your name?</h1>
            <p className="text-gray-400 font-body text-sm mb-6">Tell us your name so we can say hello!</p>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && setStep('grade')}
              placeholder="Your name…"
              className="w-full text-center text-xl border-b-2 border-gray-200 focus:border-brand-pink outline-none pb-2 mb-6 transition-colors"
            />
            <button
              disabled={!name.trim()}
              onClick={() => setStep('grade')}
              className="w-full py-4 bg-brand-pink text-white rounded-2xl font-bold text-lg disabled:opacity-40 hover:bg-pink-600 transition-colors"
            >
              Next →
            </button>
          </>
        )}

        {/* Step 2: Grade */}
        {step === 'grade' && (
          <>
            <div className="text-5xl mb-4">🎒</div>
            <h1 className="text-2xl text-brand-pink mb-2">Which class are you in?</h1>
            <p className="text-gray-400 font-body text-sm mb-6">Hi {name}! Pick your grade below.</p>
            <div className="flex gap-3 justify-center mb-6">
              {GRADE_OPTIONS.map(g => (
                <button
                  key={g.grade}
                  onClick={() => setGrade(g.grade)}
                  className={`flex-1 py-6 rounded-3xl border-4 transition-all duration-150 ${grade === g.grade ? `${g.color} scale-105 ${g.border} ring-4 ring-offset-2` : 'border-gray-100'}`}
                >
                  <div className="text-4xl mb-2">{g.icon}</div>
                  <div className="font-display text-xl">{g.label}</div>
                  <div className="text-xs text-gray-400 font-body">{g.ages}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep('name')} className="flex-1 py-3 border-2 border-gray-100 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button
                disabled={!grade}
                onClick={() => setStep('avatar')}
                className="flex-2 flex-1 py-3 bg-brand-pink text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-pink-600 transition-colors"
              >
                Next →
              </button>
            </div>
          </>
        )}

        {/* Step 3: Avatar */}
        {step === 'avatar' && (
          <>
            <div className="text-5xl mb-4">✨</div>
            <h1 className="text-2xl text-brand-pink mb-2">Pick your avatar!</h1>
            <p className="text-gray-400 font-body text-sm mb-6">Choose a character that&apos;s just like you.</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-3xl py-3 rounded-2xl transition-all duration-150 hover:scale-110 ${avatar === a ? 'bg-pink-100 ring-2 ring-brand-pink scale-110' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  {a}
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep('grade')} className="flex-1 py-3 border-2 border-gray-100 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 transition-colors">
                ← Back
              </button>
              <button
                disabled={!avatar || saving}
                onClick={finish}
                className="flex-1 py-3 bg-brand-pink text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-pink-600 transition-colors"
              >
                {saving ? '⏳ Setting up…' : "Let's Go! 🚀"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
