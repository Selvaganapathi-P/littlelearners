'use client';

import Link from 'next/link';
import { useState } from 'react';

const CURRENCIES: Record<string, { symbol: string; rate: number; label: string }> = {
  USD: { symbol: '$', rate: 1, label: 'US Dollar' },
  INR: { symbol: '₹', rate: 83, label: 'Indian Rupee' },
  GBP: { symbol: '£', rate: 0.79, label: 'British Pound' },
  EUR: { symbol: '€', rate: 0.92, label: 'Euro' },
  AED: { symbol: 'AED', rate: 3.67, label: 'UAE Dirham' },
  SGD: { symbol: 'S$', rate: 1.35, label: 'Singapore Dollar' },
};

const PLANS = [
  {
    name: 'Starter',
    icon: '🐣',
    priceMonthly: 0,
    priceYearly: 0,
    highlight: 'Free forever',
    color: '#10B981',
    features: [
      '1 child profile',
      '20 lessons access',
      'Quiz & Flashcard activities',
      'Daily Challenge',
      'Basic progress tracking',
    ],
    cta: 'Get Started Free',
    href: '/onboarding',
    popular: false,
  },
  {
    name: 'Family',
    icon: '🏠',
    priceMonthly: 9,
    priceYearly: 79,
    highlight: 'Most popular',
    color: '#FF6B9D',
    features: [
      'Up to 3 child profiles',
      'Unlimited lessons',
      'All activity types (Story, Matching, Phonics)',
      'Achievement badges & trophies',
      'Streak tracking & coins rewards',
      'Parent progress reports',
      'Download worksheets',
    ],
    cta: 'Start Family Plan',
    href: '/onboarding',
    popular: true,
  },
  {
    name: 'School',
    icon: '🏫',
    priceMonthly: 49,
    priceYearly: 399,
    highlight: 'For educators',
    color: '#7C3AED',
    features: [
      'Up to 100 student profiles',
      'Staff Studio access',
      'Create custom lessons & activities',
      'School-wide dashboard',
      'Grade-level reports (LKG & UKG)',
      'Priority support',
      'Custom branding',
      'Bulk CSV import',
    ],
    cta: 'Contact for School Plan',
    href: 'mailto:hello@littlelearners.app',
    popular: false,
  },
];

const FAQS = [
  { q: 'Can I try before buying?', a: 'Yes! Our Starter plan is free forever with 20 lessons and core activities. No credit card needed.' },
  { q: 'Which countries is LittleLearners available in?', a: 'We support families in India, USA, UAE, UK, Singapore, Malaysia, Canada, and more. Our curriculum targets LKG and UKG children globally.' },
  { q: 'Can schools get a custom quote?', a: 'Absolutely. For 100+ students or district-wide deployments, contact us for volume pricing.' },
  { q: 'What activities are included?', a: 'Every lesson has auto-generated Story Reader, Flashcard Deck, Quiz, and Matching Game — no extra work for teachers.' },
  { q: 'Is there a mobile app?', a: 'LittleLearners is a progressive web app (PWA) — install it from the browser on any phone or tablet. Native apps coming soon.' },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [currency, setCurrency] = useState('USD');
  const curr = CURRENCIES[currency];

  function fmt(usd: number) {
    if (usd === 0) return 'Free';
    const val = Math.round(usd * curr.rate);
    return `${curr.symbol}${val}`;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="text-xl font-black text-pink-500">LittleLearners</Link>
        <div className="flex gap-2">
          <Link href="/onboarding" className="px-4 py-2 bg-pink-500 text-white rounded-2xl text-sm font-bold hover:bg-pink-600 transition-colors">Get Started</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 bg-pink-100 text-pink-600 rounded-full text-sm font-bold mb-4">
            🌏 Available in 10+ countries
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4 leading-tight">
            Simple, fair pricing<br />
            <span className="text-pink-500">for every family</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Interactive quizzes, stories, flashcards & games — all designed for LKG & UKG learners.
            Start free, upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Billing toggle + currency */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <div className="flex bg-gray-100 rounded-2xl p-1">
            <button onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${billing === 'monthly' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
              Monthly
            </button>
            <button onClick={() => setBilling('yearly')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${billing === 'yearly' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}>
              Yearly <span className="ml-1 text-green-500 text-xs">Save 30%</span>
            </button>
          </div>
          <select value={currency} onChange={e => setCurrency(e.target.value)}
            className="border border-gray-200 rounded-2xl px-4 py-2 text-sm font-semibold text-gray-700 bg-white focus:outline-none focus:border-pink-400 cursor-pointer">
            {Object.entries(CURRENCIES).map(([code, c]) => (
              <option key={code} value={code}>{code} — {c.label}</option>
            ))}
          </select>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative bg-white rounded-3xl p-8 border-2 transition-all ${plan.popular ? 'border-pink-400 shadow-2xl scale-105' : 'border-gray-100 shadow-md hover:shadow-lg'}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-pink-500 text-white text-xs font-black rounded-full">
                  ⭐ Most Popular
                </div>
              )}

              <div className="text-4xl mb-3">{plan.icon}</div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">{plan.name}</h2>
              <p className="text-sm font-semibold mb-4" style={{ color: plan.color }}>{plan.highlight}</p>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-gray-900">
                    {billing === 'yearly' ? fmt(plan.priceYearly) : fmt(plan.priceMonthly)}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-gray-400 text-sm mb-1">/{billing === 'yearly' ? 'yr' : 'mo'}</span>
                  )}
                </div>
                {billing === 'yearly' && plan.priceYearly > 0 && (
                  <p className="text-sm text-green-500 font-semibold mt-1">
                    Save {fmt(plan.priceMonthly * 12 - plan.priceYearly)} vs monthly
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a href={plan.href}
                className="block w-full text-center py-3.5 rounded-2xl font-black text-white transition-all hover:opacity-90"
                style={{ backgroundColor: plan.color }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="text-center mb-16">
          <p className="text-gray-400 text-sm font-semibold mb-6">TRUSTED BY SCHOOLS AND FAMILIES IN</p>
          <div className="flex flex-wrap justify-center gap-4 text-2xl">
            {['🇮🇳 India', '🇺🇸 USA', '🇦🇪 UAE', '🇬🇧 UK', '🇸🇬 Singapore', '🇲🇾 Malaysia', '🇨🇦 Canada', '🇦🇺 Australia'].map(c => (
              <span key={c} className="px-4 py-2 bg-gray-50 rounded-full text-sm font-semibold text-gray-700">{c}</span>
            ))}
          </div>
        </div>

        {/* Feature comparison */}
        <div className="mb-16">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-8">Everything your child needs to thrive</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '❓', title: 'Smart Quizzes', desc: 'Auto-generated MCQs with hints and explanations' },
              { icon: '🃏', title: 'Flashcard Decks', desc: 'Flip-card learning for vocabulary and concepts' },
              { icon: '📖', title: 'Story Reader', desc: 'Illustrated page-by-page stories per lesson' },
              { icon: '🎯', title: 'Matching Games', desc: 'Word–emoji pair matching to boost memory' },
              { icon: '🏆', title: 'Trophy Room', desc: '16 achievements earned through streaks and scores' },
              { icon: '⚡', title: 'Daily Challenge', desc: 'One new challenge every day to build habits' },
              { icon: '📊', title: 'Parent Reports', desc: 'Track progress, XP, and activity completion' },
              { icon: '🔥', title: 'Streak System', desc: 'Daily streaks to keep children motivated' },
            ].map(f => (
              <div key={f.title} className="bg-gray-50 rounded-2xl p-5">
                <div className="text-3xl mb-2">{f.icon}</div>
                <p className="font-black text-gray-800 text-sm mb-1">{f.title}</p>
                <p className="text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-black text-gray-900 text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <details key={faq.q} className="bg-gray-50 rounded-2xl p-5 group cursor-pointer">
                <summary className="font-black text-gray-800 text-sm list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl p-12 text-white">
          <div className="text-5xl mb-4">🚀</div>
          <h2 className="text-3xl font-black mb-3">Ready to start learning?</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">Join thousands of preschoolers building skills through play. Free to try, no credit card needed.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/onboarding" className="px-8 py-4 bg-white text-pink-600 rounded-2xl font-black text-lg hover:bg-gray-50 transition-colors">
              Start Free Today
            </Link>
            <a href="mailto:hello@littlelearners.app" className="px-8 py-4 bg-white/20 text-white rounded-2xl font-black text-lg hover:bg-white/30 transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>© 2025 LittleLearners · <Link href="/pricing" className="hover:text-gray-600">Pricing</Link> · <a href="mailto:hello@littlelearners.app" className="hover:text-gray-600">Contact</a></p>
      </footer>
    </div>
  );
}
