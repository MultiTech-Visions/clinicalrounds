import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { Disclaimer } from '@/components/Disclaimer';
import { ShutdownButton } from '@/components/ShutdownButton';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ClinicalRounds — AI Multidisciplinary Case Review',
  description:
    'Instant AI-powered multidisciplinary team conference for complex clinical cases. Paste notes, get structured specialist analyses.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
          <footer className="border-t border-border">
            <Disclaimer />
          </footer>
        </div>
        <ShutdownButton />
        <AnalyticsProvider />
      </body>
    </html>
  );
}
