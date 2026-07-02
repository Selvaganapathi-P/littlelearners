import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
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
  title: {
    default: 'LittleLearners — Learn, Play & Grow',
    template: '%s · LittleLearners',
  },
  description: "India's joyful preschool learning platform for LKG & UKG children. Songs, stories, phonics, and more!",
  keywords: ['preschool', 'LKG', 'UKG', 'kids learning', 'phonics', 'nursery rhymes', 'moral stories', 'India', 'children education'],
  manifest: '/manifest.json',
  themeColor: '#FF6B9D',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LittleLearners',
  },
  openGraph: {
    title: 'LittleLearners — Learn, Play & Grow',
    description: "India's joyful preschool learning platform for LKG & UKG children",
    type: 'website',
    locale: 'en_IN',
    siteName: 'LittleLearners',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LittleLearners',
    description: 'Joyful learning for LKG & UKG',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body>
        <ServiceWorkerRegister />
        <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
      </body>
    </html>
  );
}
