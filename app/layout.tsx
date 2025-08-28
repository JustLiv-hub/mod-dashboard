// app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import { Lobster } from 'next/font/google'; // nice script font

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-script',
});

export const metadata: Metadata = {
  title: 'Discord Mod Dashboard',
  description: 'Internal dashboard for moderators',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lobster.variable}>
      <body className="min-h-screen bg-[#343a4a] text-white antialiased">{children}</body>
    </html>
  );
}
