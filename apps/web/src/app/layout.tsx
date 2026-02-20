import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils/cn';
import { ThemeProvider } from '../components/themeprovider';
import { cookies } from 'next/headers';
import { ImpersonationBanner } from '../components/layout/impersonation-banner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('givar_user')?.value;

  let isAdmin = false;

  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      isAdmin = user.role === 'ADMIN';
    } catch (e) {
      isAdmin = false;
    }
  }

  return {
    title: {
      template: isAdmin ? 'Admin Panel | Givar' : '%s | Givar',
      default: isAdmin ? 'Givar - Admin Panel' : 'Givar - Transparent Giving',
    },
    description: 'Simple, transparent, & impact-driven giving for everyone.',
    icons: {
      icon: '/Givar1.png',
    },
  };
}

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
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >

          <ImpersonationBanner />

          {children}
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}