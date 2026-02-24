import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils/cn';
import { ThemeProvider } from '../components/themeprovider';
import { cookies } from 'next/headers';
import { ImpersonationBanner } from '../components/layout/impersonation-banner';
import { ActivityMonitor } from '../components/layout/activity-monitor';

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

          <ActivityMonitor />
          <ImpersonationBanner />

          {children}

          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: '24px',
                fontWeight: 'bold',
                fontSize: '12px',
                padding: '12px 20px',
                background: 'var(--card)',
                color: 'var(--foreground)',
                border: '1px solid var(--border)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
              },
              success: {
                iconTheme: {
                  primary: 'hsl(var(--primary))',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}