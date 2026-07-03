'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Lesson, Activity, ActivityType } from '@/types';
import { VIDEO_FORMAT_LABELS, VIDEO_FORMAT_ICONS, ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/types';
import { lessonsApi, activitiesApi, childrenApi } from '@/lib/api';
import { getGradeColor } from '@/lib/utils';

// ── Sub-components ────────────────────────────────────────────────────────────

function StoryReader({ activity }: { activity: Activity }) {
  const pages = activity.content.pages ?? [];
  const [page, setPage] = useState(0);
  if (!pages.length) return <div className="text-center py-12 text-gray-400">No story pages yet.</div>;
  const p = pages[page];
  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4">
      <div className="w-full max-w-lg rounded-3xl p-8 text-center shadow-lg" style={{ backgroundColor: p.bg || '#FFF9F0', minHeight: 220 }}>
        <div className="text-6xl mb-4">{p.emoji || '📖'}</div>
        <p className="text-xl font-semibold text-gray-800 leading-relaxed">{p.text}</p>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          className="w-12 h-12 rounded-full bg-white shadow text-2xl disabled:opacity-30 hover:bg-gray-50 transition">◀</button>
        <span className="text-sm text-gray-500 font-semibold">{page + 1} / {pages.length}</span>
        <button onClick={() => setPage(p => Math.min(pages.length - 1, p + 1))} disabled={page === pages.length - 1}
          className="w-12 h-12 rounded-full bg-white shadow text-2xl disabled:opacity-30 hover:bg-gray-50 transition">▶</button>
      </div>
      <div className="flex gap-1.5">
        {pages.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === page ? 'bg-orange-400 w-4' : 'bg-gray-200'}`} />)}
      </div>
    </div>
  );
}

function FlashcardDeck({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const cards = activity.content.cards ?? [];
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  if (!cards.length) return <div className="text-center py-12 text-gray-400">No flashcards yet.</div>;
  if (done) return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">🎉</div>
      <p className="text-2xl font-bold text-gray-800 mb-2">All done!</p>
      <p className="text-gray-500 mb-6">You reviewed {cards.length} cards</p>
      <button onClick={() => { setIdx(0); setFlipped(false); setDone(false); }} className="px-6 py-3 bg-orange-400 text-white rounded-2xl font-bold mr-3">Again</button>
      <button onClick={onDone} className="px-6 py-3 bg-green-500 text-white rounded-2xl font-bold">Done ✓</button>
    </div>
  );
  const card = cards[idx];
  return (
    <div className="flex flex-col items-center gap-6 py-6 px-4">
      <p className="text-sm text-gray-400 font-semibold">{idx + 1} / {cards.length}</p>
      <div onClick={() => setFlipped(f => !f)} className="w-full max-w-sm cursor-pointer" style={{ perspective: 1000 }}>
        <div className="relative w-full transition-all duration-500" style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', height: 220 }}>
          {/* Front */}
          <div className="absolute inset-0 rounded-3xl bg-white shadow-xl flex flex-col items-center justify-center gap-3" style={{ backfaceVisibility: 'hidden' }}>
            <div className="text-5xl">{card.emoji || '⭐'}</div>
            <p className="text-4xl font-black text-gray-800">{card.front}</p>
            <p className="text-xs text-gray-400">Tap to flip</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-400 to-yellow-400 shadow-xl flex flex-col items-center justify-center gap-2 p-6" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-3xl font-black text-white">{card.back}</p>
            {card.example && <p className="text-sm text-white/80 text-center">{card.example}</p>}
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        {idx < cards.length - 1
          ? <button onClick={() => { setIdx(i => i + 1); setFlipped(false); }} className="px-8 py-3 bg-orange-400 text-white rounded-2xl font-bold">Next →</button>
          : <button onClick={() => setDone(true)} className="px-8 py-3 bg-green-500 text-white rounded-2xl font-bold">Finish 🎉</button>
        }
      </div>
    </div>
  );
}

function QuizGame({ activity, childId, colors, onDone }: { activity: Activity; childId: string | null; colors: { primary: string }; onDone: (score: number) => void }) {
  const questions = activity.content.questions ?? [];
  const [qIdx, setQIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  if (!questions.length) return <div className="text-center py-12 text-gray-400">No quiz questions yet.</div>;

  const q = questions[qIdx];

  async function handleSubmit(finalAnswers: number[]) {
    if (!childId) { setShowResult(true); return; }
    setSubmitting(true);
    try {
      const res = await activitiesApi.submit(activity._id, childId, finalAnswers) as { data: { score: number } };
      setScore(res.data.score);
    } catch { setScore(Math.round((finalAnswers.filter((a, i) => a === questions[i]?.correct).length / questions.length) * 100)); }
    setSubmitting(false);
    setShowResult(true);
    onDone(score);
  }

  function pick(optIdx: number) {
    if (chosen !== null) return;
    setChosen(optIdx);
    const newAnswers = [...answers, optIdx];
    setAnswers(newAnswers);
    setTimeout(() => {
      if (qIdx < questions.length - 1) { setQIdx(i => i + 1); setChosen(null); }
      else handleSubmit(newAnswers);
    }, 1200);
  }

  if (showResult) {
    const correct = answers.filter((a, i) => a === questions[i]?.correct).length;
    return (
      <div className="flex flex-col items-center py-10 px-4 gap-4">
        <div className="text-7xl">{score === 100 ? '🌟' : score >= 60 ? '😊' : '🤔'}</div>
        <h2 className="text-3xl font-black text-gray-800">{score === 100 ? 'Perfect!' : score >= 60 ? 'Well done!' : 'Keep trying!'}</h2>
        <div className="text-xl font-bold" style={{ color: colors.primary }}>{correct} / {questions.length} correct</div>
        <div className="w-full max-w-xs bg-gray-100 rounded-full h-4">
          <div className="h-4 rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: colors.primary }} />
        </div>
        <button onClick={() => { setQIdx(0); setChosen(null); setAnswers([]); setShowResult(false); setScore(0); }}
          className="px-8 py-3 bg-orange-400 text-white rounded-2xl font-bold mt-2">Try Again</button>
      </div>
    );
  }

  if (submitting) return <div className="text-center py-16 text-gray-500 text-lg">Saving results…</div>;

  return (
    <div className="flex flex-col gap-5 py-6 px-4 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-gray-400">Question {qIdx + 1} of {questions.length}</span>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full transition-all" style={{ width: `${((qIdx) / questions.length) * 100}%`, backgroundColor: colors.primary }} />
        </div>
      </div>
      {q.emoji && <div className="text-5xl text-center">{q.emoji}</div>}
      <p className="text-xl font-bold text-gray-800 text-center">{q.question}</p>
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isChosen = i === chosen;
          let bg = 'bg-white border-2 border-gray-100';
          if (chosen !== null && isCorrect) bg = 'bg-green-100 border-2 border-green-400';
          else if (isChosen && !isCorrect) bg = 'bg-red-100 border-2 border-red-400';
          return (
            <button key={i} onClick={() => pick(i)}
              className={`w-full text-left px-5 py-4 rounded-2xl font-semibold text-gray-800 transition-all ${bg} ${chosen === null ? 'hover:border-orange-300 hover:bg-orange-50' : ''}`}>
              {chosen !== null && isCorrect && '✅ '}{chosen !== null && isChosen && !isCorrect && '❌ '}{opt}
            </button>
          );
        })}
      </div>
      {chosen !== null && q.explanation && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700 font-medium">{q.explanation}</div>
      )}
    </div>
  );
}

function MatchingGame({ activity, onDone }: { activity: Activity; onDone: () => void }) {
  const pairs = activity.content.pairs ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);

  const words = pairs.map(p => p.word);
  const emojis = pairs.map(p => p.emoji);
  // Shuffle both columns
  const [shuffledWords] = useState(() => [...words].sort(() => Math.random() - 0.5));
  const [shuffledEmojis] = useState(() => [...emojis].sort(() => Math.random() - 0.5));

  function pick(val: string) {
    if (matched.has(val)) return;
    if (!selected) { setSelected(val); return; }
    // Check if selected + val form a valid pair
    const wordPick = words.includes(selected) ? selected : val;
    const emojiPick = emojis.includes(selected) ? selected : val;
    const pair = pairs.find(p => p.word === wordPick && p.emoji === emojiPick);
    if (pair) {
      const newMatched = new Set(matched);
      newMatched.add(pair.word); newMatched.add(pair.emoji);
      setMatched(newMatched);
      setSelected(null);
      if (newMatched.size === pairs.length * 2) setTimeout(onDone, 800);
    } else {
      setWrong(val);
      setTimeout(() => { setSelected(null); setWrong(null); }, 700);
    }
  }

  return (
    <div className="py-6 px-4">
      <p className="text-center text-sm text-gray-400 font-semibold mb-6">Tap a word, then its matching picture</p>
      <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
        <div className="flex flex-col gap-3">
          {shuffledWords.map(w => {
            const isMatched = matched.has(w);
            const isSel = selected === w;
            const isWrong = wrong === w;
            return (
              <button key={w} onClick={() => pick(w)}
                className={`py-3 px-4 rounded-2xl font-bold text-sm transition-all ${isMatched ? 'bg-green-100 text-green-600 line-through' : isSel ? 'bg-orange-400 text-white scale-105' : isWrong ? 'bg-red-100 text-red-500' : 'bg-white border-2 border-gray-100 text-gray-700 hover:border-orange-300'}`}>
                {w}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3">
          {shuffledEmojis.map(e => {
            const isMatched = matched.has(e);
            const isSel = selected === e;
            const isWrong = wrong === e;
            return (
              <button key={e} onClick={() => pick(e)}
                className={`py-3 px-4 rounded-2xl text-2xl transition-all ${isMatched ? 'bg-green-100 opacity-50' : isSel ? 'bg-orange-400 scale-105' : isWrong ? 'bg-red-100' : 'bg-white border-2 border-gray-100 hover:border-orange-300'}`}>
                {e}
              </button>
            );
          })}
        </div>
      </div>
      {matched.size === pairs.length * 2 && (
        <div className="text-center mt-8">
          <div className="text-5xl mb-2">🎯</div>
          <p className="text-xl font-bold text-gray-800">All matched!</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function ActivityHubContent() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<ActivityType | null>(null);
  const [loading, setLoading] = useState(true);
  const [xpToast, setXpToast] = useState<{ xp: number; coins: number } | null>(null);
  const [childId, setChildId] = useState<string | null>(null);

  useEffect(() => {
    setChildId(typeof window !== 'undefined' ? localStorage.getItem('ll_child') : null);
    Promise.all([
      lessonsApi.get(lessonId) as Promise<{ data: Lesson }>,
      activitiesApi.forLesson(lessonId) as Promise<{ data: Activity[] }>,
    ]).then(([lessonRes, actRes]) => {
      setLesson(lessonRes.data);
      setActivities(actRes.data);
      if (actRes.data.length) setActiveTab(actRes.data[0].type);
    }).catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [lessonId, router]);

  const handleActivityDone = useCallback((xp: number, coins: number) => {
    setXpToast({ xp, coins });
    setTimeout(() => setXpToast(null), 3000);
    if (childId) {
      childrenApi.recordWatch(childId, lessonId, 100).catch(() => {});
    }
  }, [childId, lessonId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-6xl animate-bounce">🌟</div>
    </div>
  );
  if (!lesson) return null;

  const colors = getGradeColor(lesson.grade);
  const currentActivity = activities.find(a => a.type === activeTab);
  const tabOrder: ActivityType[] = ['story', 'flashcard', 'quiz', 'matching', 'phonics', 'fill_blank'];
  const availableTabs = tabOrder.filter(t => activities.some(a => a.type === t));

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* XP Toast */}
      {xpToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-gray-900 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-black text-sm">+{xpToast.xp} XP • +{xpToast.coins} Coins!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition">←</button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-800 text-sm leading-tight truncate">{lesson.title}</p>
            <p className="text-xs text-gray-400">{VIDEO_FORMAT_ICONS[lesson.videoFormat]} {VIDEO_FORMAT_LABELS[lesson.videoFormat]} · {lesson.grade}</p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: colors.primary }}>{lesson.grade}</span>
        </div>

        {/* Activity tabs */}
        {availableTabs.length > 1 && (
          <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide max-w-2xl mx-auto">
            {availableTabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                style={activeTab === tab ? { backgroundColor: colors.primary } : {}}>
                {ACTIVITY_ICONS[tab]} {ACTIVITY_LABELS[tab]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {!currentActivity ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-lg font-semibold">Activities loading…</p>
          </div>
        ) : currentActivity.type === 'story' ? (
          <StoryReader activity={currentActivity} />
        ) : currentActivity.type === 'flashcard' ? (
          <FlashcardDeck activity={currentActivity} onDone={() => handleActivityDone(currentActivity.xpReward, currentActivity.coinsReward)} />
        ) : currentActivity.type === 'quiz' ? (
          <QuizGame activity={currentActivity} childId={childId} colors={colors} onDone={(s) => handleActivityDone(Math.round(currentActivity.xpReward * s / 100), Math.round(currentActivity.coinsReward * s / 100))} />
        ) : currentActivity.type === 'matching' ? (
          <MatchingGame activity={currentActivity} onDone={() => handleActivityDone(currentActivity.xpReward, currentActivity.coinsReward)} />
        ) : (
          <div className="text-center py-20 text-gray-400">Activity type coming soon!</div>
        )}
      </div>

      {/* Tags */}
      {lesson.tags.length > 0 && (
        <div className="max-w-2xl mx-auto px-4 py-4 flex flex-wrap gap-2 border-t border-gray-100 mt-4">
          {lesson.tags.map(t => (
            <Link key={t} href={`/dashboard?grade=${lesson.grade}&tag=${encodeURIComponent(t)}`}
              className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-500 border border-gray-200 hover:border-orange-300 hover:text-orange-500 transition">
              #{t}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-6xl animate-bounce">🌟</div></div>}>
      <ActivityHubContent />
    </Suspense>
  );
}
