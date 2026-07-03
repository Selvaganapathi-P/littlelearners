'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, useTransform, useSpring } from 'framer-motion';

const FLOATERS = [
  { emoji: '⭐', x: 8,  y: 12, size: 2.8, delay: 0,   dur: 4.0 },
  { emoji: '🌈', x: 88, y: 8,  size: 3.2, delay: 0.5, dur: 5.2 },
  { emoji: '🎈', x: 12, y: 65, size: 2.4, delay: 1.0, dur: 4.5 },
  { emoji: '🦋', x: 82, y: 55, size: 3.0, delay: 0.3, dur: 3.8 },
  { emoji: '🌸', x: 48, y: 84, size: 2.2, delay: 0.8, dur: 5.5 },
  { emoji: '🎵', x: 93, y: 38, size: 2.4, delay: 1.2, dur: 4.0 },
  { emoji: '🌟', x: 4,  y: 42, size: 2.6, delay: 0.6, dur: 3.8 },
  { emoji: '🐝', x: 68, y: 18, size: 2.2, delay: 1.5, dur: 5.0 },
  { emoji: '🍎', x: 22, y: 88, size: 2.4, delay: 0.9, dur: 4.2 },
  { emoji: '🎨', x: 58, y: 4,  size: 2.8, delay: 0.2, dur: 3.6 },
  { emoji: '🐣', x: 35, y: 74, size: 2.2, delay: 1.1, dur: 4.8 },
  { emoji: '🎯', x: 76, y: 78, size: 2.5, delay: 0.7, dur: 4.3 },
];

const FEATURES = [
  { icon: '🎤', title: 'Sing-Along Rhymes',      desc: 'Word-by-word karaoke highlighting for classic nursery rhymes', color: '#FF6B9D', bg: '#FFF0F5' },
  { icon: '🔤', title: 'Phonics Songs',           desc: 'A-Z letter sounds set to simple, catchy melodies',           color: '#7C3AED', bg: '#F5F0FF' },
  { icon: '📖', title: 'Moral Stories',           desc: 'Short fables with a positively-framed lesson every time',    color: '#10B981', bg: '#F0FFF8' },
  { icon: '💃', title: 'Dance & Movement',        desc: 'Action songs children follow along — clap, jump, spin!',    color: '#FFB347', bg: '#FFFAF0' },
  { icon: '🎉', title: 'Festival Specials',       desc: 'Diwali, Christmas, Eid, Pongal — auto-scheduled',           color: '#06B6D4', bg: '#F0FBFF' },
  { icon: '🧘', title: 'Calm-Down Songs',         desc: 'Gentle breathing and stretch videos for wind-down',         color: '#EC4899', bg: '#FFF0F8' },
];

const STATS = [
  { value: 15,  suffix: '',  label: 'Video formats' },
  { value: 2,   suffix: '',  label: 'Grade levels'  },
  { value: 100, suffix: '%', label: 'Child-safe'    },
  { value: '∞', suffix: '',  label: 'Joy'           },
];

function CountUp({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const total = 60;
    const timer = setInterval(() => {
      frame++;
      setN(Math.round((frame / total) * target));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <>{n}{suffix}</>;
}

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-50, 50], [8, -8]);
  const rotateY = useTransform(x, [-50, 50], [-8, 8]);
  const springX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  function onMove(e: React.MouseEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(e.clientX - rect.left - rect.width / 2);
    y.set(e.clientY - rect.top - rect.height / 2);
  }
  function onLeave() { x.set(0); y.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: springX, rotateY: springY, transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 16 } },
};

export default function HomePage() {
  const statsRef  = useRef(null);
  const featRef   = useRef(null);
  const statsView = useInView(statsRef, { once: true, margin: '-80px' });
  const featView  = useInView(featRef,  { once: true, margin: '-80px' });

  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(135deg,#FFF5FB 0%,#FFFBF0 50%,#F0F8FF 100%)' }}>

      {/* Floating background emojis */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {FLOATERS.map((f, i) => (
          <motion.div
            key={i}
            className="absolute select-none"
            style={{ left: `${f.x}%`, top: `${f.y}%`, fontSize: `${f.size}rem`, opacity: 0.18 }}
            animate={{ y: [0, -18, 0], rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
          >
            {f.emoji}
          </motion.div>
        ))}
      </div>

      {/* Nav */}
      <motion.nav
        className="sticky top-0 z-50 bg-white/75 backdrop-blur-lg border-b border-pink-100 px-6 py-3 flex items-center justify-between"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <motion.span
          className="text-2xl font-display"
          style={{ color: '#FF6B9D' }}
          whileHover={{ scale: 1.08 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          🌟 LittleLearners
        </motion.span>
        <div className="flex items-center gap-3">
          <Link href="/parent-login"  className="hidden sm:block text-sm font-semibold text-purple-600 hover:underline">Parent Login</Link>
          <Link href="/staff-login"   className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-gray-800">Staff Login</Link>
          <Link href="/admin-login"   className="text-sm font-semibold text-gray-500 hover:text-gray-800">Admin Login</Link>
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
            <Link href="/dashboard?grade=LKG"
              className="px-4 py-2 text-white rounded-2xl text-sm font-bold shadow-lg"
              style={{ background: 'linear-gradient(135deg,#FF6B9D,#FF8E53)' }}>
              Start Learning ✨
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 px-4 pt-20 pb-24 text-center">
        <motion.div
          className="text-8xl mb-4 inline-block"
          animate={{ y: [0, -14, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          🌟
        </motion.div>

        <motion.h1
          className="text-6xl md:text-8xl mb-4 leading-tight"
          style={{ fontFamily: 'var(--font-fredoka)', background: 'linear-gradient(135deg,#FF6B9D,#7C3AED,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.1 }}
        >
          LittleLearners
        </motion.h1>

        <motion.p
          className="text-xl md:text-2xl text-gray-600 font-body font-semibold mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Joyful learning for LKG &amp; UKG 🎓
        </motion.p>
        <motion.p
          className="text-gray-400 font-body mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
        >
          AI-powered videos — rhymes, phonics, stories, dance &amp; more —
          built for children aged 3.5 to 5.5 years.
        </motion.p>

        {/* Grade cards */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {/* LKG */}
          <motion.div variants={fadeUp}>
            <TiltCard>
              <Link href="/dashboard?grade=LKG">
                <motion.div
                  className="bg-white rounded-4xl p-8 cursor-pointer min-w-[200px] relative overflow-hidden"
                  style={{ border: '4px solid #FF6B9D', boxShadow: '0 8px 0 0 #FF6B9D40' }}
                  whileHover={{ y: -6, boxShadow: '0 16px 0 0 #FF6B9D40' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 70% 20%,#FF6B9D,transparent 60%)' }} />
                  <motion.div
                    className="text-7xl mb-3 inline-block"
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >🐣</motion.div>
                  <h2 className="text-4xl mb-1" style={{ fontFamily: 'var(--font-fredoka)', color: '#FF6B9D' }}>LKG</h2>
                  <p className="text-gray-400 font-body text-sm mb-4">Ages 3.5 – 4.5</p>
                  <motion.div
                    className="px-5 py-2 text-white rounded-2xl text-sm font-bold inline-block"
                    style={{ background: 'linear-gradient(135deg,#FF6B9D,#FF8E53)' }}
                    whileHover={{ scale: 1.08 }}
                  >
                    Let&apos;s Go! →
                  </motion.div>
                </motion.div>
              </Link>
            </TiltCard>
          </motion.div>

          {/* UKG */}
          <motion.div variants={fadeUp}>
            <TiltCard>
              <Link href="/dashboard?grade=UKG">
                <motion.div
                  className="bg-white rounded-4xl p-8 cursor-pointer min-w-[200px] relative overflow-hidden"
                  style={{ border: '4px solid #7C3AED', boxShadow: '0 8px 0 0 #7C3AED40' }}
                  whileHover={{ y: -6, boxShadow: '0 16px 0 0 #7C3AED40' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 70% 20%,#7C3AED,transparent 60%)' }} />
                  <motion.div
                    className="text-7xl mb-3 inline-block"
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity }}
                  >🦋</motion.div>
                  <h2 className="text-4xl mb-1" style={{ fontFamily: 'var(--font-fredoka)', color: '#7C3AED' }}>UKG</h2>
                  <p className="text-gray-400 font-body text-sm mb-4">Ages 4.5 – 5.5</p>
                  <motion.div
                    className="px-5 py-2 text-white rounded-2xl text-sm font-bold inline-block"
                    style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }}
                    whileHover={{ scale: 1.08 }}
                  >
                    Let&apos;s Go! →
                  </motion.div>
                </motion.div>
              </Link>
            </TiltCard>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <motion.section
        ref={statsRef}
        className="relative z-10 py-8 px-4"
        style={{ background: 'linear-gradient(135deg,#FF6B9D,#7C3AED,#06B6D4)' }}
        initial={{ opacity: 0 }}
        animate={statsView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        {/* Animated wave top */}
        <div className="absolute -top-6 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1200 40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8">
            <path d="M0,20 C300,40 900,0 1200,20 L1200,0 L0,0 Z" fill="#F0F8FF" />
          </svg>
        </div>
        <div className="max-w-3xl mx-auto flex flex-wrap justify-around gap-8 py-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center text-white"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={statsView ? { scale: 1, opacity: 1 } : {}}
              transition={{ type: 'spring', stiffness: 200, damping: 14, delay: i * 0.1 }}
            >
              <div className="text-4xl font-bold" style={{ fontFamily: 'var(--font-fredoka)' }}>
                {typeof s.value === 'number'
                  ? <CountUp target={s.value} suffix={s.suffix} inView={statsView} />
                  : <>{s.value}</>}
              </div>
              <div className="text-sm font-body text-white/75 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
        {/* Animated wave bottom */}
        <div className="absolute -bottom-6 left-0 right-0 overflow-hidden leading-none">
          <svg viewBox="0 0 1200 40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-8">
            <path d="M0,20 C300,0 900,40 1200,20 L1200,40 L0,40 Z" fill="#FFFBF0" />
          </svg>
        </div>
      </motion.section>

      {/* Features */}
      <section ref={featRef} className="relative z-10 px-4 py-24">
        <motion.div
          className="max-w-4xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate={featView ? 'show' : 'hidden'}
        >
          <motion.h2
            className="text-4xl text-center text-gray-800 mb-2"
            style={{ fontFamily: 'var(--font-fredoka)' }}
            variants={fadeUp}
          >
            Everything a preschooler needs ✨
          </motion.h2>
          <motion.p className="text-center text-gray-400 font-body mb-14" variants={fadeUp}>
            15 video formats · All generated by AI · All child-safe
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="bg-white rounded-3xl p-6 cursor-default relative overflow-hidden"
                style={{ boxShadow: `0 4px 0 0 ${f.color}30`, border: `2px solid ${f.color}20` }}
              >
                <div
                  className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10"
                  style={{ background: f.color }}
                />
                <motion.div
                  className="text-5xl mb-3 inline-block"
                  animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 3 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                >
                  {f.icon}
                </motion.div>
                <h3 className="text-lg text-gray-800 mb-1" style={{ fontFamily: 'var(--font-fredoka)', color: f.color }}>{f.title}</h3>
                <p className="text-sm text-gray-500 font-body leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-4 py-20 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#7C3AED,#06B6D4)' }} />
        {/* Animated circles */}
        {[0,1,2,3].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full opacity-10 bg-white"
            style={{ width: 200 + i*80, height: 200 + i*80, left: '50%', top: '50%', x: '-50%', y: '-50%' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.05, 0.1] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
        <div className="relative max-w-2xl mx-auto text-white">
          <motion.h2
            className="text-4xl mb-4"
            style={{ fontFamily: 'var(--font-fredoka)' }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            For Schools &amp; Teachers 🏫
          </motion.h2>
          <motion.p
            className="font-body text-white/80 mb-10 text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            Staff Studio lets your team create, schedule &amp; publish
            AI-generated lessons in minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.25 }}
          >
            <motion.div whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link href="/login"
                className="inline-block px-10 py-4 bg-white rounded-3xl font-bold text-lg shadow-xl"
                style={{ color: '#7C3AED' }}>
                Sign In as Staff →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 text-center text-gray-400 text-sm font-body border-t border-pink-100"
        style={{ background: '#FFFBF5' }}>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          LittleLearners © 2026 · Built for curious little minds 💛
        </motion.p>
        <div className="flex gap-4 justify-center mt-3">
          <Link href="/parent-login" className="hover:text-gray-600 transition-colors">Parent Login</Link>
          <span>·</span>
          <Link href="/staff-login"  className="hover:text-gray-600 transition-colors">Staff Login</Link>
          <span>·</span>
          <Link href="/admin-login"  className="hover:text-gray-600 transition-colors">Admin Login</Link>
          <span>·</span>
          <Link href="/founder"  className="hover:text-gray-600 transition-colors">About Founder</Link>
          <span>·</span>
          <Link href="/admin"    className="hover:text-gray-600 transition-colors">Admin</Link>
        </div>
      </footer>
    </main>
  );
}
