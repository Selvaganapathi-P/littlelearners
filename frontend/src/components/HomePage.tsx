'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useTransform, useSpring, AnimatePresence } from 'framer-motion';

// ── Data ──────────────────────────────────────────────────────────────────────

const ORBS = [
  { color: '#FF6B9D', size: 420, x: -10, y: -10, dur: 18 },
  { color: '#7C3AED', size: 380, x: 70,  y: 60,  dur: 22 },
  { color: '#06B6D4', size: 300, x: 40,  y: 80,  dur: 16 },
  { color: '#FFB347', size: 250, x: 85,  y: 20,  dur: 20 },
];

const FLOATERS = [
  { emoji: '⭐', x: 6,  y: 15, size: 2.6, delay: 0,   dur: 4.2 },
  { emoji: '🌈', x: 89, y: 10, size: 3.0, delay: 0.6, dur: 5.0 },
  { emoji: '🎈', x: 14, y: 70, size: 2.2, delay: 1.1, dur: 4.6 },
  { emoji: '🦋', x: 80, y: 58, size: 2.8, delay: 0.4, dur: 3.9 },
  { emoji: '🌸', x: 50, y: 85, size: 2.0, delay: 0.9, dur: 5.3 },
  { emoji: '🎵', x: 94, y: 40, size: 2.3, delay: 1.3, dur: 4.1 },
  { emoji: '🌟', x: 3,  y: 45, size: 2.5, delay: 0.7, dur: 3.7 },
  { emoji: '🐝', x: 70, y: 22, size: 2.1, delay: 1.6, dur: 4.9 },
  { emoji: '🍎', x: 25, y: 90, size: 2.3, delay: 1.0, dur: 4.4 },
  { emoji: '🎨', x: 60, y: 5,  size: 2.7, delay: 0.3, dur: 3.5 },
  { emoji: '🐣', x: 38, y: 76, size: 2.0, delay: 1.2, dur: 4.7 },
  { emoji: '🎯', x: 77, y: 80, size: 2.4, delay: 0.8, dur: 4.2 },
  { emoji: '🧠', x: 45, y: 30, size: 1.8, delay: 1.4, dur: 5.1 },
  { emoji: '🎪', x: 18, y: 40, size: 2.1, delay: 0.2, dur: 3.8 },
];

const LIVE_DEMOS = [
  {
    id: 'quiz',
    label: '❓ Quiz',
    color: '#FF6B9D',
    bg: 'linear-gradient(135deg,#FF6B9D22,#FF8E5311)',
    preview: {
      question: 'Which animal says "Moo"? 🐄',
      options: ['🐶 Dog', '🐄 Cow', '🐱 Cat', '🐸 Frog'],
      correct: 1,
    },
  },
  {
    id: 'flashcard',
    label: '🃏 Flashcard',
    color: '#7C3AED',
    bg: 'linear-gradient(135deg,#7C3AED22,#06B6D411)',
    preview: { front: 'A', back: 'Apple 🍎', example: 'A is for Apple!' },
  },
  {
    id: 'story',
    label: '📖 Story',
    color: '#10B981',
    bg: 'linear-gradient(135deg,#10B98122,#06B6D411)',
    preview: {
      pages: [
        { text: 'One sunny day, Leo the lion woke up feeling brave! 🦁', emoji: '☀️', bg: '#FFF9E6' },
        { text: 'He walked through the jungle and found a tiny bird stuck in a tree.', emoji: '🌳', bg: '#E6F9F0' },
        { text: 'Leo gently freed the bird. "Thank you!" chirped the bird. 🐦', emoji: '💛', bg: '#FFF0F5' },
      ],
    },
  },
  {
    id: 'matching',
    label: '🎯 Match It',
    color: '#F59E0B',
    bg: 'linear-gradient(135deg,#F59E0B22,#EF444411)',
    preview: { pairs: [{ w: 'Cat', e: '🐱' }, { w: 'Dog', e: '🐶' }, { w: 'Fish', e: '🐟' }] },
  },
  {
    id: 'memory',
    label: '🧠 Memory',
    color: '#06B6D4',
    bg: 'linear-gradient(135deg,#06B6D422,#7C3AED11)',
    preview: { cards: ['🍎','🍌','🍎','🍊','🍌','🍊'] },
  },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '👶', title: 'Create a child profile', desc: 'Add your child\'s name, avatar and grade (LKG or UKG) in 30 seconds.', color: '#FF6B9D' },
  { step: '02', icon: '📚', title: 'Pick a lesson', desc: 'Browse rhymes, phonics, stories, numbers — every topic has 4 activities auto-generated.', color: '#7C3AED' },
  { step: '03', icon: '🎮', title: 'Learn through play', desc: 'Quizzes, flashcards, stories and matching games keep kids engaged and learning.', color: '#10B981' },
  { step: '04', icon: '🏆', title: 'Earn XP & trophies', desc: 'Streaks, coins, level-ups and 16 achievements motivate children to come back daily.', color: '#F59E0B' },
];

const TESTIMONIALS = [
  { name: 'Priya M.', role: 'Parent · Bangalore', avatar: '👩', quote: 'My daughter asks for LittleLearners every morning before school. The flashcard games are her absolute favourite!', stars: 5 },
  { name: 'Ravi K.', role: 'Parent · Dubai', avatar: '👨', quote: 'We tried 4 apps. This is the first one where my son actually remembers what he learned the next day.', stars: 5 },
  { name: 'Anita J.', role: 'LKG Teacher · Chennai', avatar: '👩‍🏫', quote: 'The Staff Studio is brilliant. I create a lesson with activities in minutes and assign it to the whole class.', stars: 5 },
  { name: 'Sarah T.', role: 'Parent · London', avatar: '🧑', quote: 'Perfect for our bilingual home. The phonics activities helped my 4-year-old learn English letter sounds so quickly!', stars: 5 },
];

const GAMIFICATION = [
  { icon: '⭐', label: 'XP Points', desc: 'Earn XP for every completed activity', color: '#F59E0B', val: 2450 },
  { icon: '🪙', label: 'Coins', desc: 'Spend coins to unlock power-ups', color: '#EF4444', val: 312 },
  { icon: '🔥', label: 'Streaks', desc: 'Daily streaks build learning habits', color: '#F97316', val: 14 },
  { icon: '🏆', label: 'Trophies', desc: '16 achievements to unlock', color: '#8B5CF6', val: 8 },
];

const FEATURES = [
  { icon: '❓', title: 'Smart Quizzes', desc: 'Auto-generated MCQs with hints, emoji clues & explanations', color: '#FF6B9D', bg: '#FFF0F5' },
  { icon: '🃏', title: 'Flashcard Decks', desc: 'Flip-card vocabulary with examples, animated 3D flips', color: '#7C3AED', bg: '#F5F0FF' },
  { icon: '📖', title: 'Story Reader', desc: 'Page-by-page illustrated stories from every lesson', color: '#10B981', bg: '#F0FFF8' },
  { icon: '🎯', title: 'Matching Games', desc: 'Word–emoji pair matching to cement memory', color: '#F59E0B', bg: '#FFFAF0' },
  { icon: '🧠', title: 'Memory Game', desc: 'Flip card pairs — trains visual memory and concentration', color: '#06B6D4', bg: '#F0FBFF' },
  { icon: '✏️', title: 'Spell It!', desc: 'Unscramble letters to spell words from the lesson', color: '#EC4899', bg: '#FFF0F8' },
  { icon: '🏆', title: 'Trophies & XP', desc: '16 achievements: streaks, perfect scores, XP milestones', color: '#8B5CF6', bg: '#F5F0FF' },
  { icon: '⚡', title: 'Daily Challenge', desc: 'Seed-based new challenge every day to build habits', color: '#F97316', bg: '#FFF7F0' },
  { icon: '📊', title: 'Parent Reports', desc: 'Track XP, activity history, streak and achievements', color: '#0EA5E9', bg: '#F0F8FF' },
];

const COUNTRIES = ['🇮🇳 India', '🇺🇸 USA', '🇦🇪 UAE', '🇬🇧 UK', '🇸🇬 Singapore', '🇲🇾 Malaysia', '🇨🇦 Canada', '🇦🇺 Australia', '🇳🇿 New Zealand', '🇿🇦 South Africa'];

// ── Sub-components ────────────────────────────────────────────────────────────

function CountUp({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let frame = 0; const total = 80;
    const timer = setInterval(() => {
      frame++;
      setN(Math.round((frame / total) * target));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <>{n.toLocaleString()}{suffix}</>;
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [10, -10]);
  const rotateY = useTransform(x, [-50, 50], [-10, 10]);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });
  function onMove(e: React.MouseEvent) {
    const r = ref.current?.getBoundingClientRect(); if (!r) return;
    x.set(e.clientX - r.left - r.width / 2);
    y.set(e.clientY - r.top - r.height / 2);
  }
  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 1000 }}
      className={className}>
      {children}
    </motion.div>
  );
}

// Live Demo: Quiz preview
function QuizPreview({ demo }: { demo: typeof LIVE_DEMOS[0] }) {
  const [chosen, setChosen] = useState<number | null>(null);
  useEffect(() => {
    setChosen(null);
    const t = setTimeout(() => setChosen(demo.preview.correct as number), 2200);
    return () => clearTimeout(t);
  }, [demo]);
  const { question, options, correct } = demo.preview as { question: string; options: string[]; correct: number };
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="font-bold text-gray-800 text-sm text-center">{question}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o, i) => (
          <motion.div key={i}
            animate={chosen !== null && i === correct ? { scale: [1, 1.08, 1], backgroundColor: '#dcfce7' } : {}}
            className={`text-sm px-3 py-2.5 rounded-xl font-semibold text-center cursor-default border-2 transition-all ${chosen !== null && i === correct ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-700'}`}>
            {o}
          </motion.div>
        ))}
      </div>
      {chosen !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center text-green-600 font-bold text-sm">
          ✅ Correct! +10 XP ⭐
        </motion.div>
      )}
    </div>
  );
}

// Live Demo: Flashcard preview
function FlashcardPreview({ demo }: { demo: typeof LIVE_DEMOS[0] }) {
  const [flipped, setFlipped] = useState(false);
  useEffect(() => {
    setFlipped(false);
    const t = setTimeout(() => setFlipped(true), 1500);
    return () => clearTimeout(t);
  }, [demo]);
  const { front, back, example } = demo.preview as { front: string; back: string; example: string };
  return (
    <div className="flex items-center justify-center p-4 h-40" style={{ perspective: 1000 }}>
      <motion.div className="relative w-full h-36 cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.7, type: 'spring', stiffness: 100 }}
        onClick={() => setFlipped(f => !f)}>
        <div className="absolute inset-0 rounded-2xl bg-white shadow-lg flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden' }}>
          <div className="text-5xl font-black text-purple-600">{front}</div>
          <p className="text-xs text-gray-400 mt-2">Tap to reveal</p>
        </div>
        <div className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}>
          <div className="text-2xl font-black text-white">{back}</div>
          <div className="text-white/80 text-xs mt-1">{example}</div>
        </div>
      </motion.div>
    </div>
  );
}

// Live Demo: Story preview
function StoryPreview({ demo }: { demo: typeof LIVE_DEMOS[0] }) {
  const { pages } = demo.preview as { pages: { text: string; emoji: string; bg: string }[] };
  const [p, setP] = useState(0);
  useEffect(() => {
    setP(0);
    const t = setInterval(() => setP(x => (x + 1) % pages.length), 2000);
    return () => clearInterval(t);
  }, [demo, pages.length]);
  const page = pages[p];
  return (
    <AnimatePresence mode="wait">
      <motion.div key={p} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
        className="rounded-2xl p-4 m-4 text-center" style={{ backgroundColor: page.bg }}>
        <div className="text-4xl mb-2">{page.emoji}</div>
        <p className="text-sm font-semibold text-gray-700 leading-relaxed">{page.text}</p>
        <div className="flex justify-center gap-1 mt-3">
          {pages.map((_, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === p ? 'bg-green-400 w-4' : 'bg-gray-200'}`} />)}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Live Demo: Matching preview
function MatchingPreview({ demo }: { demo: typeof LIVE_DEMOS[0] }) {
  const { pairs } = demo.preview as { pairs: { w: string; e: string }[] };
  const [matched, setMatched] = useState<number[]>([]);
  const [sel, setSel] = useState<{ side: 'w' | 'e'; idx: number } | null>(null);

  useEffect(() => {
    setMatched([]); setSel(null);
    let i = 0;
    const t = setInterval(() => {
      setMatched(prev => { if (prev.length >= pairs.length) { clearInterval(t); return prev; } return [...prev, prev.length]; });
      i++;
      if (i >= pairs.length) clearInterval(t);
    }, 900);
    return () => clearInterval(t);
  }, [demo, pairs.length]);

  return (
    <div className="grid grid-cols-2 gap-2 p-4">
      <div className="space-y-2">
        {pairs.map((p, i) => (
          <motion.div key={i} animate={matched.includes(i) ? { backgroundColor: '#dcfce7', borderColor: '#86efac' } : { backgroundColor: '#fff' }}
            className="px-3 py-2 rounded-xl text-sm font-bold text-center border-2 border-gray-100">
            {matched.includes(i) ? '✅ ' : ''}{p.w}
          </motion.div>
        ))}
      </div>
      <div className="space-y-2">
        {pairs.map((p, i) => (
          <motion.div key={i} animate={matched.includes(i) ? { backgroundColor: '#dcfce7', borderColor: '#86efac' } : { backgroundColor: '#fff' }}
            className="px-3 py-2 rounded-xl text-2xl text-center border-2 border-gray-100">
            {p.e}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Live Demo: Memory preview
function MemoryPreview({ demo }: { demo: typeof LIVE_DEMOS[0] }) {
  const { cards } = demo.preview as { cards: string[] };
  const [revealed, setRevealed] = useState<number[]>([]);
  useEffect(() => {
    setRevealed([]);
    let step = 0;
    const seq = [0, 2, 0, 2]; // reveal 0, reveal 2, match both
    const t = setInterval(() => {
      if (step < seq.length) { setRevealed(prev => [...new Set([...prev, seq[step]])]); step++; }
      else clearInterval(t);
    }, 700);
    return () => clearInterval(t);
  }, [demo]);
  return (
    <div className="grid grid-cols-3 gap-2 p-4">
      {cards.map((c, i) => (
        <motion.div key={i}
          animate={revealed.includes(i) ? { rotateY: 180 } : { rotateY: 0 }}
          transition={{ duration: 0.4 }}
          className="h-12 rounded-xl flex items-center justify-center text-xl cursor-pointer"
          style={{ backgroundColor: revealed.includes(i) ? '#f0fdf4' : '#7C3AED', border: revealed.includes(i) ? '2px solid #86efac' : 'none' }}>
          {revealed.includes(i) ? c : '?'}
        </motion.div>
      ))}
    </div>
  );
}

// Testimonial card
function TestimonialCard({ t, i }: { t: typeof TESTIMONIALS[0]; i: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 50 }} animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: i * 0.12, type: 'spring', stiffness: 100, damping: 14 }}
      whileHover={{ y: -6, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}
      className="bg-white rounded-3xl p-6 flex flex-col gap-3">
      <div className="flex gap-0.5">
        {Array.from({ length: t.stars }).map((_, si) => (
          <motion.span key={si} initial={{ scale: 0 }} animate={inView ? { scale: 1 } : {}} transition={{ delay: i * 0.12 + si * 0.06 }}
            className="text-yellow-400 text-lg">★</motion.span>
        ))}
      </div>
      <p className="text-gray-700 text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-50">
        <span className="text-2xl">{t.avatar}</span>
        <div>
          <p className="font-bold text-gray-800 text-sm">{t.name}</p>
          <p className="text-xs text-gray-400">{t.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Orbiting stars around hero
function OrbitingStars() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="absolute w-2 h-2 rounded-full bg-yellow-300"
          style={{ left: '50%', top: '50%', marginLeft: -4, marginTop: -4 }}
          animate={{ x: Math.cos((i / 8) * Math.PI * 2) * 180, y: Math.sin((i / 8) * Math.PI * 2) * 80, opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: 'linear', delay: i * 0.4 }} />
      ))}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [demoKey, setDemoKey] = useState(0);
  const statsRef = useRef(null);
  const howRef = useRef(null);
  const gamRef = useRef(null);
  const statsView = useInView(statsRef, { once: true, margin: '-80px' });
  const howView = useInView(howRef, { once: true, margin: '-80px' });
  const gamView = useInView(gamRef, { once: true, margin: '-60px' });

  // Auto-cycle demo tabs
  useEffect(() => {
    const t = setInterval(() => {
      setActiveDemo(d => { const next = (d + 1) % LIVE_DEMOS.length; setDemoKey(k => k + 1); return next; });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  function pickDemo(i: number) { setActiveDemo(i); setDemoKey(k => k + 1); }

  const currentDemo = LIVE_DEMOS[activeDemo];

  function renderDemoContent(demo: typeof LIVE_DEMOS[0], key: number) {
    switch (demo.id) {
      case 'quiz': return <QuizPreview key={key} demo={demo} />;
      case 'flashcard': return <FlashcardPreview key={key} demo={demo} />;
      case 'story': return <StoryPreview key={key} demo={demo} />;
      case 'matching': return <MatchingPreview key={key} demo={demo} />;
      case 'memory': return <MemoryPreview key={key} demo={demo} />;
      default: return null;
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAFAFF]">

      {/* ── Animated gradient orbs (background) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {ORBS.map((o, i) => (
          <motion.div key={i}
            className="absolute rounded-full blur-3xl opacity-[0.07]"
            style={{ width: o.size, height: o.size, backgroundColor: o.color, left: `${o.x}%`, top: `${o.y}%` }}
            animate={{ x: [0, 40, -30, 0], y: [0, -30, 40, 0], scale: [1, 1.15, 0.9, 1] }}
            transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }} />
        ))}
      </div>

      {/* ── Floating emojis ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {FLOATERS.map((f, i) => (
          <motion.div key={i} className="absolute select-none"
            style={{ left: `${f.x}%`, top: `${f.y}%`, fontSize: `${f.size}rem`, opacity: 0.14 }}
            animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}>
            {f.emoji}
          </motion.div>
        ))}
      </div>

      {/* ── Sticky Nav ── */}
      <motion.nav
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-50 px-6 py-3 flex items-center justify-between"
        initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}>
        <motion.span className="text-2xl font-display" style={{ color: '#FF6B9D' }}
          whileHover={{ scale: 1.06 }} transition={{ type: 'spring', stiffness: 400 }}>
          🌟 LittleLearners
        </motion.span>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="hidden md:block text-sm font-semibold text-gray-500 hover:text-purple-600 transition-colors">Pricing</Link>
          <Link href="/parent-login" className="hidden md:block text-sm font-semibold text-purple-600 hover:underline">Parent Login</Link>
          <Link href="/staff-login" className="hidden md:block text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">Staff</Link>
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link href="/onboarding" className="px-5 py-2.5 text-white rounded-2xl text-sm font-black shadow-lg"
              style={{ background: 'linear-gradient(135deg,#FF6B9D,#7C3AED)' }}>
              Start Free ✨
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="relative z-10 px-4 pt-16 pb-10 text-center">
        {/* Sparkle badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm font-bold shadow-md mb-6 border border-purple-100"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}>
          <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>✨</motion.span>
          <span className="text-purple-600">Now with Memory & Spelling Games!</span>
        </motion.div>

        {/* Hero title */}
        <div className="relative inline-block mb-4">
          <OrbitingStars />
          <motion.h1
            className="text-6xl md:text-8xl lg:text-9xl leading-none"
            style={{ fontFamily: 'var(--font-fredoka)', background: 'linear-gradient(135deg,#FF6B9D 0%,#7C3AED 50%,#06B6D4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            initial={{ opacity: 0, scale: 0.6, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 14, delay: 0.15 }}>
            LittleLearners
          </motion.h1>
        </div>

        <motion.p className="text-2xl md:text-3xl text-gray-700 font-semibold mb-3"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}>
          Where preschoolers <span style={{ color: '#FF6B9D' }}>love</span> to learn 🎓
        </motion.p>
        <motion.p className="text-gray-500 text-lg mb-8 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}>
          9 interactive activity types for LKG &amp; UKG. Quizzes, flashcards, stories, matching, memory games &amp; more —
          all gamified with XP, coins and trophies.
        </motion.p>

        {/* Activity pills */}
        <motion.div className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          {['❓ Quizzes', '🃏 Flashcards', '📖 Stories', '🎯 Matching', '🧠 Memory', '✏️ Spell It', '🏆 Trophies', '⚡ Daily Challenge'].map((f, i) => (
            <motion.span key={f} whileHover={{ scale: 1.08, y: -2 }}
              className="px-4 py-2 bg-white rounded-full font-bold text-sm text-gray-700 shadow-sm border border-gray-100 cursor-default"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.05 }}>
              {f}
            </motion.span>
          ))}
        </motion.div>

        {/* Grade CTA cards */}
        <motion.div className="flex flex-col sm:flex-row gap-5 justify-center mb-16"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, type: 'spring' }}>
          {[
            { grade: 'LKG', emoji: '🐣', ages: '3.5 – 4.5', color: '#FF6B9D', gradient: 'linear-gradient(135deg,#FF6B9D,#FF8E53)', shadow: '#FF6B9D40' },
            { grade: 'UKG', emoji: '🦋', ages: '4.5 – 5.5', color: '#7C3AED', gradient: 'linear-gradient(135deg,#7C3AED,#06B6D4)', shadow: '#7C3AED40' },
          ].map(g => (
            <TiltCard key={g.grade}>
              <Link href={`/dashboard?grade=${g.grade}`}>
                <motion.div
                  className="bg-white rounded-3xl p-8 cursor-pointer min-w-[220px] relative overflow-hidden group"
                  style={{ border: `3px solid ${g.color}`, boxShadow: `0 8px 0 0 ${g.shadow}` }}
                  whileHover={{ y: -8, boxShadow: `0 20px 0 0 ${g.shadow}` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <div className="absolute inset-0 opacity-[0.07]" style={{ background: `radial-gradient(circle at 70% 20%,${g.color},transparent 60%)` }} />
                  <motion.div className="text-6xl mb-3 inline-block"
                    animate={{ rotate: [0, 10, -10, 0], y: [0, -4, 0] }}
                    transition={{ duration: 2.5 + (g.grade === 'UKG' ? 0.3 : 0), repeat: Infinity }}>
                    {g.emoji}
                  </motion.div>
                  <h2 className="text-4xl mb-1" style={{ fontFamily: 'var(--font-fredoka)', color: g.color }}>{g.grade}</h2>
                  <p className="text-gray-400 text-sm mb-5">Ages {g.ages}</p>
                  <motion.div className="px-6 py-2.5 text-white rounded-2xl text-sm font-black inline-block shadow-md"
                    style={{ background: g.gradient }} whileHover={{ scale: 1.06 }}>
                    Start Learning →
                  </motion.div>
                </motion.div>
              </Link>
            </TiltCard>
          ))}
        </motion.div>

        {/* ── Live Activity Demo ── */}
        <motion.div className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, type: 'spring' }}>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Live Activity Preview</p>

          {/* Tab selector */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center mb-4">
            {LIVE_DEMOS.map((d, i) => (
              <motion.button key={d.id} onClick={() => pickDemo(i)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${activeDemo === i ? 'text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100'}`}
                style={activeDemo === i ? { backgroundColor: d.color } : {}}>
                {d.label}
              </motion.button>
            ))}
          </div>

          {/* Demo window */}
          <motion.div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            layout style={{ minHeight: 200 }}>
            {/* Window chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-50" style={{ background: currentDemo.bg }}>
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-3 bg-white/70 rounded-full px-3 py-1 text-xs text-gray-500 font-mono">
                littlelearners.app/watch/abc123
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={`${activeDemo}-${demoKey}`}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}>
                {renderDemoContent(currentDemo, demoKey)}
              </motion.div>
            </AnimatePresence>
            {/* Progress bar */}
            <div className="h-1 bg-gray-50">
              <motion.div className="h-1" style={{ backgroundColor: currentDemo.color }}
                initial={{ width: '0%' }} animate={{ width: '100%' }}
                transition={{ duration: 5, ease: 'linear', repeat: Infinity, repeatType: 'loop' }} />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Animated Stats Banner ── */}
      <motion.section ref={statsRef} className="relative z-10 py-12 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#FF6B9D,#7C3AED,#06B6D4)' }}>
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="absolute rounded-full bg-white/10"
              style={{ width: 80 + i * 40, height: 80 + i * 40, left: `${10 + i * 15}%`, top: '50%', translateY: '-50%' }}
              animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.4 }} />
          ))}
        </div>
        {/* waves */}
        <div className="absolute -top-6 left-0 right-0">
          <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="w-full h-8">
            <path d="M0,20 C300,40 900,0 1200,20 L1200,0 L0,0 Z" fill="#FAFAFF" />
          </svg>
        </div>
        <div className="relative max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white py-2">
          {[
            { val: 9, suf: '', label: 'Activity Types' },
            { val: 16, suf: '', label: 'Achievements' },
            { val: 10, suf: '+', label: 'Countries' },
            { val: 100, suf: '%', label: 'Child-Safe' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ scale: 0.3, opacity: 0 }} animate={statsView ? { scale: 1, opacity: 1 } : {}}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: i * 0.12 }}>
              <motion.div className="text-5xl font-black mb-1" style={{ fontFamily: 'var(--font-fredoka)' }}>
                <CountUp target={s.val} suffix={s.suf} inView={statsView} />
              </motion.div>
              <div className="text-white/80 text-sm font-semibold">{s.label}</div>
            </motion.div>
          ))}
        </div>
        <div className="absolute -bottom-6 left-0 right-0">
          <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="w-full h-8">
            <path d="M0,20 C300,0 900,40 1200,20 L1200,40 L0,40 Z" fill="#FAFAFF" />
          </svg>
        </div>
      </motion.section>

      {/* ── How It Works ── */}
      <section ref={howRef} className="relative z-10 px-4 py-24 max-w-5xl mx-auto">
        <motion.div className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }} animate={howView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
            How it works
          </h2>
          <p className="text-gray-500 text-lg">Start learning in under 2 minutes</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-pink-200 via-purple-200 to-cyan-200" />

          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={step.step}
              initial={{ opacity: 0, y: 50 }} animate={howView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, type: 'spring', stiffness: 100, damping: 14 }}
              whileHover={{ y: -8 }}
              className="bg-white rounded-3xl p-6 text-center shadow-md border border-gray-50 relative">
              <motion.div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-md"
                style={{ background: `${step.color}22` }}
                animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3 + i * 0.4, repeat: Infinity }}>
                {step.icon}
              </motion.div>
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md"
                style={{ backgroundColor: step.color }}>
                {i + 1}
              </div>
              <h3 className="font-black text-gray-800 mb-2 text-sm">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Feature Grid ── */}
      <section className="relative z-10 px-4 py-16 max-w-6xl mx-auto">
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
            Everything a preschooler needs ✨
          </h2>
          <p className="text-gray-500">Every lesson auto-generates all 9 activity types — zero extra work for parents or teachers</p>
        </motion.div>

        <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} variants={fadeUp}
              whileHover={{ y: -8, boxShadow: `0 20px 60px ${f.color}25` }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              className="bg-white rounded-3xl p-6 relative overflow-hidden border-2 cursor-default"
              style={{ borderColor: `${f.color}20`, boxShadow: `0 4px 0 0 ${f.color}18` }}>
              <div className="absolute top-0 right-0 w-28 h-28 rounded-bl-full opacity-[0.08]"
                style={{ background: f.color }} />
              <motion.div className="text-5xl mb-4 inline-block"
                animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3 + i * 0.25, repeat: Infinity, delay: i * 0.2 }}>
                {f.icon}
              </motion.div>
              <h3 className="text-lg font-black mb-1" style={{ color: f.color }}>{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Gamification showcase ── */}
      <section ref={gamRef} className="relative z-10 px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{ background: 'repeating-linear-gradient(45deg,#7C3AED 0,#7C3AED 1px,transparent 0,transparent 50%)' , backgroundSize: '20px 20px' }} />
        <div className="relative max-w-5xl mx-auto">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }} animate={gamView ? { opacity: 1, y: 0 } : {}}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
            <h2 className="text-4xl md:text-5xl text-gray-900 mb-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
              Kids love earning rewards 🏆
            </h2>
            <p className="text-gray-500">XP, coins, level-ups and trophies keep children motivated every single day</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {GAMIFICATION.map((g, i) => (
              <motion.div key={g.label}
                initial={{ opacity: 0, scale: 0.7 }} animate={gamView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 14 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl p-6 text-center shadow-md">
                <motion.div className="text-5xl mb-3"
                  animate={{ y: [0, -8, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}>
                  {g.icon}
                </motion.div>
                <motion.div className="text-3xl font-black mb-1" style={{ color: g.color }}
                  initial={{ opacity: 0 }} animate={gamView ? { opacity: 1 } : {}} transition={{ delay: i * 0.12 + 0.3 }}>
                  <CountUp target={g.val} suffix="" inView={gamView} />
                </motion.div>
                <p className="font-bold text-gray-800 text-sm">{g.label}</p>
                <p className="text-xs text-gray-400 mt-1">{g.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* XP progress bar demo */}
          <motion.div className="bg-white rounded-3xl p-6 shadow-md max-w-md mx-auto"
            initial={{ opacity: 0, y: 30 }} animate={gamView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, type: 'spring' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center text-2xl relative">
                🐣
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full text-xs font-black flex items-center justify-center text-white">7</span>
              </div>
              <div className="flex-1">
                <p className="font-black text-gray-800">Arjun · Level 7</p>
                <p className="text-xs text-gray-400">2,450 XP · 312 coins · 14🔥 streak</p>
              </div>
            </div>
            <div className="mb-2 flex justify-between text-xs text-gray-400 font-semibold">
              <span>Level 7</span><span>Level 8</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
              <motion.div className="h-4 rounded-full" style={{ background: 'linear-gradient(90deg,#FF6B9D,#7C3AED)' }}
                initial={{ width: '0%' }} animate={gamView ? { width: '68%' } : {}}
                transition={{ duration: 1.5, delay: 0.7, ease: 'easeOut' }} />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">2,450 / 3,600 XP</p>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="relative z-10 px-4 py-20 max-w-6xl mx-auto">
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}>
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-3" style={{ fontFamily: 'var(--font-fredoka)' }}>
            Loved by families worldwide 💛
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            {COUNTRIES.map(c => (
              <motion.span key={c} whileHover={{ scale: 1.08, y: -2 }}
                className="px-4 py-2 bg-white rounded-full text-sm font-semibold text-gray-700 shadow-sm border border-gray-100 cursor-default">
                {c}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TESTIMONIALS.map((t, i) => <TestimonialCard key={t.name} t={t} i={i} />)}
        </div>
      </section>

      {/* ── School CTA ── */}
      <section className="relative z-10 px-4 py-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#1a0533,#0c2340)' }} />
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(#7C3AED 1px,transparent 1px),linear-gradient(90deg,#7C3AED 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        {/* Orbs */}
        {[{ c: '#FF6B9D', x: '15%', y: '30%' }, { c: '#7C3AED', x: '80%', y: '60%' }, { c: '#06B6D4', x: '60%', y: '20%' }].map((o, i) => (
          <motion.div key={i} className="absolute w-64 h-64 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: o.c, left: o.x, top: o.y }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.3, 0.2] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7 }} />
        ))}

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div className="text-6xl mb-6"
            animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}>🏫</motion.div>
          <motion.h2 className="text-4xl md:text-6xl text-white mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
            Built for Schools Too
          </motion.h2>
          <motion.p className="text-white/70 text-lg mb-4 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            Staff Studio lets teachers create custom lessons and activities, manage up to 100 students,
            and track class-wide progress — all from one dashboard.
          </motion.p>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {['Custom lessons', 'Activity creator', 'Class dashboard', 'Bulk CSV import', 'Grade-level reports', 'Priority support'].map((f, i) => (
              <motion.span key={f} className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/80 text-sm font-semibold"
                initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.07 }}>
                ✓ {f}
              </motion.span>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
              <Link href="/pricing" className="inline-block px-10 py-4 bg-white rounded-2xl font-black text-lg shadow-2xl"
                style={{ color: '#7C3AED' }}>
                View School Pricing →
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
              <Link href="/staff-login" className="inline-block px-10 py-4 bg-white/10 border border-white/30 rounded-2xl font-black text-lg text-white">
                Staff Login
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-4 py-24 text-center">
        <motion.div className="max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 100, damping: 14 }}>
          <motion.div className="text-7xl mb-6"
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}>🚀</motion.div>
          <h2 className="text-4xl md:text-6xl text-gray-900 mb-4" style={{ fontFamily: 'var(--font-fredoka)' }}>
            Ready to start?
          </h2>
          <p className="text-gray-500 text-lg mb-10">Free forever · No credit card · Set up in 30 seconds</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
              <Link href="/onboarding" className="inline-block px-10 py-5 text-white rounded-2xl font-black text-xl shadow-2xl"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#7C3AED)' }}>
                Start Learning Free ✨
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
              <Link href="/pricing" className="inline-block px-10 py-5 bg-white border-2 border-gray-200 rounded-2xl font-black text-xl text-gray-700 shadow-md hover:border-purple-300 transition-colors">
                See Pricing
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-gray-100 py-10 px-4 text-center text-gray-400 text-sm" style={{ background: '#FAFAFF' }}>
        <motion.div className="text-2xl mb-3" animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}>🌟</motion.div>
        <p className="font-semibold text-gray-600 mb-1">LittleLearners</p>
        <p className="mb-4">Built for curious little minds · © 2026</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
          {[['Pricing', '/pricing'], ['Parent Login', '/parent-login'], ['Staff Login', '/staff-login'], ['Admin', '/admin-login'], ['About Founder', '/founder']].map(([label, href]) => (
            <Link key={label} href={href} className="hover:text-purple-500 transition-colors font-medium">{label}</Link>
          ))}
        </div>
      </footer>
    </main>
  );
}
