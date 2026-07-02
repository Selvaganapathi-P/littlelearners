import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'LittleLearners — Learn, Play & Grow',
  description: "India's joyful preschool learning platform. AI-powered songs, phonics, stories, and more for LKG & UKG children aged 3.5–5.5.",
  openGraph: {
    title: 'LittleLearners — Joyful Preschool Learning',
    description: 'AI-powered videos for LKG & UKG children. Rhymes, phonics, stories, dance & more.',
    type: 'website',
  },
};

export default function Page() {
  return <HomePage />;
}
