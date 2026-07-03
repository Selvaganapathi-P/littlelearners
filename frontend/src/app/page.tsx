import type { Metadata } from 'next';
import HomePage from '@/components/HomePage';

export const metadata: Metadata = {
  title: 'LittleLearners — Interactive Learning for Preschoolers',
  description: "Quizzes, flashcards, stories & matching games for LKG & UKG children aged 3.5–5.5. Earn XP, coins & trophies while learning!",
  openGraph: {
    title: 'LittleLearners — Interactive Preschool Learning',
    description: 'Quizzes, flashcards, stories & matching games for LKG & UKG children. Gamified learning with XP, coins & achievements.',
    type: 'website',
  },
};

export default function Page() {
  return <HomePage />;
}
