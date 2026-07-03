'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Lesson, Activity } from '@/types';
import { ACTIVITY_ICONS, ACTIVITY_LABELS, VIDEO_FORMAT_ICONS } from '@/types';
import { lessonsApi, activitiesApi } from '@/lib/api';
import { getGradeColor } from '@/lib/utils';
import { ChildNav } from '@/components/ChildNav';

function dailySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededPick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function QuizChallenge({ activity, onScore }: { activity: Activity; onScore: (pct: number) => void }) {
  const questions = activity.content.questions ?? [];
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  if (!questions.length) return <div className="text-center py-12 text-gray-400">No questions for today.</div>;

  const q = questions[qIdx];

  function pick(i: number) {
    if (chosen !== null) return;
    setChosen(i);
    const next = [...answers, i];
    setAnswers(next);
    setTimeout(() => {
      if (qIdx < questions.length - 1) { setQIdx(x => x + 1); setChosen(null); }
      else {
        const correct = next.filter((a, j) => a === questions[j]?.correct).length;
        const pct = Math.round((correct / questions.length) * 100);
        setDone(true);
        onScore(pct);
      }
    }, 1000);
  }

  if (done) {
    const correct = answers.filter((a, i) => a === questions[i]?.correct).length;
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-3">{correct === questions.length ? '🌟' : correct >= Math.ceil(questions.length / 2) ? '😊' : '🤔'}</div>
        <p className="text-2xl font-black text-gray-800 mb-1">{correct}/{questions.length} correct!</p>
        <p className="text-gray-400 text-sm">Challenge complete for today</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-400 font-semibold">Q{qIdx + 1}/{questions.length}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full bg-orange-400 transition-all" style={{ width: `${(qIdx / questions.length) * 100}%` }} />
        </div>
      </div>
      {q.emoji && <div className="text-5xl text-center">{q.emoji}</div>}
      <p className="text-xl font-bold text-gray-800 text-center">{q.question}</p>
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isChosen = i === chosen;
          let bg = 'bg-white border-2 border-gray-100 hover:border-orange-300 hover:bg-orange-50';
          if (chosen !== null && isCorrect) bg = 'bg-green-100 border-2 border-green-400';
          else if (isChosen) bg = 'bg-red-100 border-2 border-red-400';
          return (
            <button key={i} onClick={() => pick(i)}
              className={`w-full text-left px-5 py-4 rounded-2xl font-semibold text-gray-800 transition-all ${bg}`}>
              {chosen !== null && isCorrect ? '✅ ' : ''}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DailyChallengeContent() {
  const params = useSearchParams();
  const router = useRouter();
  const grade = (params.get('grade') || 'LKG') as 'LKG' | 'UKG';
  const childId = params.get('child') ?? (typeof window !== 'undefined' ? localStorage.getItem('ll_child') : null);
  const colors = getGradeColor(grade);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [xpEarned, setXpEarned] = useState(0);

  const seed = dailySeed();

  useEffect(() => {
    lessonsApi.list({ grade, limit: '50', page: '1' })
      .then((res: unknown) => {
        const lessons = (res as { data: Lesson[] }).data;
        if (!lessons.length) { setLoading(false); return; }
        const daily = seededPick(lessons, seed);
        setLesson(daily);
        return activitiesApi.forLesson(daily._id);
      })
      .then((actRes: unknown) => {
        if (!actRes) return;
        const acts = (actRes as { data: Activity[] }).data;
        const quiz = acts.find(a => a.type === 'quiz') ?? acts[0] ?? null;
        setActivity(quiz);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [grade, seed]);

  const handleScore = useCallback(async (pct: number) => {
    setScore(pct);
    if (!activity) return;
    const xp = Math.round(activity.xpReward * pct / 100);
    setXpEarned(xp);
    if (childId) {
      try {
        await activitiesApi.submit(activity._id, childId, []);
      } catch { /* silent */ }
    }
  }, [activity, childId]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <div className="relative overflow-hidden px-4 py-8 text-center" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
        <button onClick={() => router.back()} className="absolute top-4 left-4 text-white/70 hover:text-white text-sm">← Back</button>
        <div className="text-4xl mb-1">⚡</div>
        <h1 className="text-2xl font-black text-white">Daily Challenge</h1>
        <p className="text-white/70 text-sm mt-1">{today}</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-5xl animate-bounce mb-4">⚡</div>
            <p className="text-gray-400">Loading today&apos;s challenge…</p>
          </div>
        ) : !lesson || !activity ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📚</div>
            <p className="font-semibold">No challenges yet — check back tomorrow!</p>
            <button onClick={() => router.push(`/dashboard?grade=${grade}`)}
              className="mt-6 px-6 py-3 rounded-2xl text-white font-bold" style={{ backgroundColor: colors.primary }}>
              Browse Lessons
            </button>
          </div>
        ) : score !== null ? (
          <div className="text-center py-8">
            <div className="text-7xl mb-4">{score === 100 ? '🌟' : score >= 60 ? '🎉' : '💪'}</div>
            <h2 className="text-3xl font-black text-gray-800 mb-2">
              {score === 100 ? 'Perfect!' : score >= 60 ? 'Great job!' : 'Keep it up!'}
            </h2>
            <p className="text-gray-500 mb-1">You scored {score}%</p>
            {xpEarned > 0 && <p className="text-yellow-500 font-bold text-lg">+{xpEarned} XP earned!</p>}
            <div className="mt-4 bg-white rounded-3xl p-4 card-shadow-sm text-left">
              <p className="text-xs text-gray-400 font-semibold mb-1">Today&apos;s lesson</p>
              <p className="font-bold text-gray-800">{lesson.title}</p>
              <p className="text-sm text-gray-400 mt-0.5">{VIDEO_FORMAT_ICONS[lesson.videoFormat]} {lesson.grade}</p>
            </div>
            <p className="text-sm text-gray-400 mt-6">Come back tomorrow for a new challenge! 🔥</p>
          </div>
        ) : (
          <>
            {/* Lesson card */}
            <div className="bg-white rounded-3xl p-4 mb-6 card-shadow-sm flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: colors.secondary + '33' }}>
                {VIDEO_FORMAT_ICONS[lesson.videoFormat]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-sm leading-tight">{lesson.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{grade} · {ACTIVITY_ICONS[activity.type]} {ACTIVITY_LABELS[activity.type]}</p>
              </div>
              <div className="text-center bg-yellow-50 rounded-2xl px-3 py-2">
                <p className="text-sm font-black text-yellow-600">+{activity.xpReward}</p>
                <p className="text-xs text-yellow-500">XP</p>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white rounded-3xl p-6 card-shadow">
              <QuizChallenge activity={activity} onScore={handleScore} />
            </div>
          </>
        )}
      </div>

      <ChildNav grade={grade} childId={childId} />
    </div>
  );
}

export default function DailyChallengePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-5xl animate-bounce">⚡</div></div>}>
      <DailyChallengeContent />
    </Suspense>
  );
}
