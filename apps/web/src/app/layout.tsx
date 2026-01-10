import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils/cn';
import { ThemeProvider } from '../components/themeprovider';

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
    <html lang="en" suppressHydrationWarning> 
      <body className={cn(inter.className, 'bg-background min-h-screen antialiased')}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}