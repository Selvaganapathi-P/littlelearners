import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-pink-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-8xl mb-6 animate-bounce">🙈</div>
      <h1 className="text-5xl text-brand-pink mb-3">Oops!</h1>
      <p className="text-xl text-gray-600 font-body mb-2">We couldn&apos;t find that page.</p>
      <p className="text-gray-400 font-body text-sm mb-10">It might have moved or never existed.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/dashboard?grade=LKG"
          className="px-8 py-4 bg-brand-pink text-white rounded-3xl font-bold text-lg hover:bg-pink-600 transition-colors card-shadow">
          🐣 Watch Videos
        </Link>
        <Link href="/"
          className="px-8 py-4 bg-white text-brand-pink rounded-3xl font-bold text-lg border-2 border-brand-pink hover:bg-pink-50 transition-colors">
          🏠 Home
        </Link>
      </div>
    </div>
  );
}
