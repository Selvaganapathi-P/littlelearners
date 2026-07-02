import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-8xl text-brand-pink mb-4 drop-shadow-sm">
          LittleLearners
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 font-body font-semibold">
          Learn, Play &amp; Grow — for LKG &amp; UKG
        </p>
      </div>

      {/* Grade selector cards */}
      <div className="flex flex-col sm:flex-row gap-6 mb-12">
        <Link href="/dashboard?grade=LKG" className="group">
          <div className="bg-white rounded-5xl p-8 card-shadow hover:scale-105 transition-transform cursor-pointer border-4 border-lkg-primary text-center min-w-[220px]">
            <div className="text-7xl mb-4">🐣</div>
            <h2 className="text-3xl text-lkg-primary">LKG</h2>
            <p className="text-gray-500 font-body text-sm mt-1">Ages 3.5 – 4.5 yrs</p>
          </div>
        </Link>

        <Link href="/dashboard?grade=UKG" className="group">
          <div className="bg-white rounded-5xl p-8 card-shadow hover:scale-105 transition-transform cursor-pointer border-4 border-ukg-primary text-center min-w-[220px]">
            <div className="text-7xl mb-4">🦋</div>
            <h2 className="text-3xl text-ukg-primary">UKG</h2>
            <p className="text-gray-500 font-body text-sm mt-1">Ages 4.5 – 5.5 yrs</p>
          </div>
        </Link>
      </div>

      {/* Staff / Admin links */}
      <div className="flex gap-4 text-sm font-body">
        <Link href="/studio" className="text-gray-400 hover:text-brand-pink underline transition-colors">
          Staff Studio
        </Link>
        <span className="text-gray-300">·</span>
        <Link href="/founder" className="text-gray-400 hover:text-brand-purple underline transition-colors">
          Founder Mode
        </Link>
      </div>
    </main>
  );
}
