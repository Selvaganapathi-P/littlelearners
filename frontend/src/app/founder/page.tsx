'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const VISION = [
  { icon: '🎯', title: 'Mission', desc: 'Make joyful, high-quality preschool education accessible to every child in India — regardless of location or background.' },
  { icon: '🌟', title: 'Vision', desc: 'A world where every LKG & UKG child learns through songs, stories, and play — powered by AI, guided by love.' },
  { icon: '💡', title: 'Innovation', desc: 'Using cutting-edge AI to generate child-safe educational videos in 15 formats — phonics, rhymes, moral stories, dance & more.' },
];

const STATS = [
  { value: '15+', label: 'Video Formats' },
  { value: '2',   label: 'Grade Levels' },
  { value: '100%', label: 'Child Safe' },
  { value: '∞',   label: 'Passion' },
];

const SKILLS = ['AI Product Development', 'EdTech', 'Full Stack Engineering', 'UI/UX Design', 'Video Pipeline', 'Early Childhood Education'];

export default function FounderPage() {
  return (
    <main className="min-h-screen" style={{ background: 'linear-gradient(135deg,#0F0C29,#302B63,#24243E)' }}>

      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <Link href="/" className="text-xl font-display text-pink-400">🌟 LittleLearners</Link>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Staff Login →</Link>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row items-center gap-12">

          {/* Photo */}
          <motion.div
            className="relative flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 120, damping: 14 }}
          >
            {/* Glow ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg,#FF6B9D,#7C3AED,#06B6D4)', padding: 4, borderRadius: '50%' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-white/10"
              style={{ background: '#1a1a2e' }}>
              <Image
                src="/founder.jpg"
                alt="Selvaganapathi — Founder of LittleLearners"
                fill
                className="object-cover object-top"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Fallback avatar */}
              <div className="absolute inset-0 flex items-center justify-center text-7xl">👨‍💻</div>
            </div>

            {/* Floating badge */}
            <motion.div
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg,#FF6B9D,#7C3AED)' }}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🚀 Founder & CEO
            </motion.div>
          </motion.div>

          {/* Info */}
          <motion.div
            className="text-center md:text-left"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
          >
            <p className="text-pink-400 font-body font-semibold tracking-widest text-sm uppercase mb-2">Meet the Founder</p>
            <h1 className="text-5xl md:text-6xl font-display text-white mb-1" style={{ fontFamily: 'var(--font-fredoka)' }}>
              Selvaganapathi
            </h1>
            <p className="text-purple-300 font-body text-lg mb-6">Builder · Dreamer · EdTech Innovator</p>

            <p className="text-gray-300 font-body leading-relaxed mb-4 max-w-lg">
              I&apos;m the founder of <span className="text-pink-400 font-semibold">LittleLearners</span> — India&apos;s joyful AI-powered preschool learning platform.
              I built this because I believe every child deserves fun, engaging, and safe educational content
              from the very first day of school.
            </p>
            <p className="text-gray-400 font-body leading-relaxed max-w-lg">
              From building the AI video pipeline to designing every screen, I&apos;ve poured my heart into
              making learning magical for LKG &amp; UKG children across India. 🇮🇳
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mt-6 justify-center md:justify-start">
              {SKILLS.map(s => (
                <motion.span
                  key={s}
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white/80 border border-white/20"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                  whileHover={{ scale: 1.08, borderColor: '#FF6B9D' }}
                >
                  {s}
                </motion.span>
              ))}
            </div>

            {/* Contact */}
            <div className="flex gap-4 mt-8 justify-center md:justify-start">
              <motion.a
                href="https://github.com/Selvaganapathi-P"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#7C3AED)' }}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
              >
                GitHub →
              </motion.a>
              <motion.a
                href="mailto:selvaganapathims007@gmail.com"
                className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white/80 border border-white/20 hover:border-pink-400 transition-colors"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
              >
                Contact
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 py-10 px-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: 'spring' }}
            >
              <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-fredoka)', background: 'linear-gradient(135deg,#FF6B9D,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </div>
              <div className="text-sm text-gray-400 font-body">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vision */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <motion.h2
          className="text-3xl text-center text-white mb-12"
          style={{ fontFamily: 'var(--font-fredoka)' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          What drives me 💫
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {VISION.map((v, i) => (
            <motion.div
              key={v.title}
              className="rounded-3xl p-6 border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, type: 'spring' }}
              whileHover={{ y: -6, borderColor: '#FF6B9D50' }}
            >
              <div className="text-4xl mb-4">{v.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-fredoka)' }}>{v.title}</h3>
              <p className="text-gray-400 font-body text-sm leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pb-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-400 font-body mb-6">Want to experience what we&apos;ve built?</p>
          <motion.div whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }} className="inline-block">
            <Link href="/"
              className="px-10 py-4 rounded-3xl font-bold text-white text-lg inline-block"
              style={{ background: 'linear-gradient(135deg,#FF6B9D,#7C3AED,#06B6D4)' }}>
              Explore LittleLearners 🌟
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-gray-600 text-sm font-body">
        LittleLearners © 2026 · Built with ❤️ by Selvaganapathi
      </footer>
    </main>
  );
}
