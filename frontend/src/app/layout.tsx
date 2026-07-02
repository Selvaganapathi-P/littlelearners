import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

const fredoka = Fredoka({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LittleLearners — Learn, Play & Grow',
  description: "India's joyful preschool learning platform for LKG & UKG children",
  keywords: ['preschool', 'LKG', 'UKG', 'kids learning', 'phonics', 'nursery rhymes', 'moral stories'],
  openGraph: {
    title: 'LittleLearners',
    description: 'Joyful learning for LKG & UKG',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
