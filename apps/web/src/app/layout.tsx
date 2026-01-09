import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils/cn';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Givar',
  description: 'Simple, transparent, impact-driven giving.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={cn(inter.className, 'bg-slate-50 min-h-screen antialiased')}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}