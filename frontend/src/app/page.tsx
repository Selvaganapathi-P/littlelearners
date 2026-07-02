import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'LittleLearners — Learn, Play & Grow',
  description: "India's joyful preschool learning platform. AI-powered songs, phonics, stories, and more for LKG & UKG children aged 3.5–5.5.",
  openGraph: {
    title: 'LittleLearners — Joyful Preschool Learning',
    description: 'AI-powered videos for LKG & UKG children. Rhymes, phonics, stories, dance & more.',
    type: 'website',
  },
};

const FEATURES = [
  { icon: '🎤', title: 'Sing-Along Rhymes',    desc: 'Word-by-word karaoke highlighting for classic nursery rhymes' },
  { icon: '🔤', title: 'Phonics Songs',        desc: 'A-Z letter sounds set to simple, catchy melodies' },
  { icon: '📖', title: 'Moral Stories',        desc: 'Short animated fables with a positively-framed lesson every time' },
  { icon: '💃', title: 'Dance & Movement',     desc: 'Action songs children follow along with — clap, jump, spin!' },
  { icon: '🎉', title: 'Festival Specials',    desc: 'Diwali, Christmas, Eid, Pongal & more — auto-scheduled around your calendar' },
  { icon: '🧘', title: 'Calm-Down Songs',      desc: 'Gentle breathing and stretch videos for a peaceful wind-down' },
];

const STATS = [
  { value: '15',    label: 'Video formats' },
  { value: '2',     label: 'Grade levels' },
  { value: '100%',  label: 'Child-safe' },
  { value: '∞',     label: 'Joy' },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FFFBF5] overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-3 flex items-center justify-between">
        <span className="text-2xl text-brand-pink font-display">LittleLearners</span>
        <div className="flex items-center gap-3">
          <Link href="/register" className="text-sm text-brand-purple font-semibold hover:underline transition-colors hidden sm:block">Parent Sign Up</Link>
          <Link href="/parent" className="text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors hidden sm:block">Parent Login</Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-800 font-semibold transition-colors">Staff Login</Link>
          <Link href="/dashboard?grade=LKG"
            className="px-4 py-2 bg-brand-pink text-white rounded-xl text-sm font-bold hover:bg-pink-600 transition-colors">
            Start Learning
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 pt-20 pb-24 text-center overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-pink-100 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-60" />
        <div className="absolute top-10 right-0 w-56 h-56 bg-yellow-100 rounded-full translate-x-1/3 opacity-60" />
        <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-purple-100 rounded-full opacity-40" />

        <div className="relative max-w-3xl mx-auto">
          <div className="text-7xl mb-6 animate-float inline-block">🌟</div>
          <h1 className="text-5xl md:text-7xl text-brand-pink mb-4 leading-tight">
            LittleLearners
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 font-body font-semibold mb-3">
            Joyful learning for LKG &amp; UKG
          </p>
          <p className="text-gray-400 font-body mb-10 max-w-xl mx-auto">
            AI-powered videos — rhymes, phonics, stories, dance &amp; more —
            built for children aged 3.5 to 5.5 years.
          </p>

          {/* Grade cards */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard?grade=LKG">
              <div className="group bg-white rounded-4xl p-8 card-shadow hover:scale-105 transition-all duration-200 cursor-pointer border-4 border-lkg-primary min-w-[200px]">
                <div className="text-6xl mb-3 group-hover:animate-wiggle inline-block">🐣</div>
                <h2 className="text-3xl text-lkg-primary mb-1">LKG</h2>
                <p className="text-gray-400 font-body text-sm">Ages 3.5 – 4.5</p>
                <div className="mt-4 px-4 py-2 bg-lkg-primary text-white rounded-2xl text-sm font-bold inline-block">
                  Let&apos;s Go! →
                </div>
              </div>
            </Link>

            <Link href="/dashboard?grade=UKG">
              <div className="group bg-white rounded-4xl p-8 card-shadow hover:scale-105 transition-all duration-200 cursor-pointer border-4 border-ukg-primary min-w-[200px]">
                <div className="text-6xl mb-3 group-hover:animate-wiggle inline-block">🦋</div>
                <h2 className="text-3xl text-ukg-primary mb-1">UKG</h2>
                <p className="text-gray-400 font-body text-sm">Ages 4.5 – 5.5</p>
                <div className="mt-4 px-4 py-2 bg-ukg-primary text-white rounded-2xl text-sm font-bold inline-block">
                  Let&apos;s Go! →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-brand-pink py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-around gap-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center text-white">
              <div className="text-3xl font-display">{s.value}</div>
              <div className="text-sm font-body text-pink-100 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature grid */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl text-center text-gray-800 mb-2">Everything a preschooler needs</h2>
          <p className="text-center text-gray-400 font-body mb-12">15 video formats. All generated by AI. All child-safe.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-3xl p-6 card-shadow-sm hover:card-shadow transition-shadow">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-display text-lg text-gray-800 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 font-body leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For schools CTA */}
      <section className="bg-gradient-to-r from-brand-purple to-brand-cyan px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto text-white">
          <h2 className="text-3xl mb-3">For Schools &amp; Teachers</h2>
          <p className="font-body text-white/80 mb-8">
            Staff Studio lets your team create, schedule, and publish AI-generated lessons in minutes.
            Content calendar automation keeps variety on autopilot.
          </p>
          <Link href="/login"
            className="inline-block px-8 py-4 bg-white text-brand-purple rounded-3xl font-bold text-lg hover:bg-gray-50 transition-colors card-shadow">
            Sign In as Staff →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-gray-400 text-sm font-body border-t border-gray-100">
        <p>LittleLearners © 2026 · Built for curious little minds 💛</p>
        <div className="flex gap-4 justify-center mt-3">
          <Link href="/register" className="hover:text-gray-600 transition-colors">Parent Sign Up</Link>
          <span>·</span>
          <Link href="/parent" className="hover:text-gray-600 transition-colors">Parent Login</Link>
          <span>·</span>
          <Link href="/login" className="hover:text-gray-600 transition-colors">Staff Login</Link>
          <span>·</span>
          <Link href="/founder" className="hover:text-gray-600 transition-colors">Founder Mode</Link>
        </div>
      </footer>
    </main>
  );
}
