import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { cn } from '../lib/utils/cn';
import { ThemeProvider } from '../components/providers/themeprovider';
import { cookies } from 'next/headers';
import { ImpersonationBanner } from '../components/layout/impersonation-banner';
import { ActivityMonitor } from '../components/layout/activity-monitor';
import { ScrollToTop } from '../components/layout/scroll-to-top';
import { Suspense } from 'react';
import { PostHogProvider } from '../components/providers/posthog-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://givarapp.com';
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
    metadataBase: new URL(baseUrl),
    title: {
      template: isAdmin ? 'Admin Panel | Givar' : '%s | Givar',
      default: isAdmin ? 'Givar - Admin Panel' : 'Givar - Transparent Giving',
    },
    description: 'Simple, transparent, & impact-driven giving for everyone.',
    applicationName: 'Givar',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: 'Givar',
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: '/Givar1.png',
      apple: '/Givar1.png',
    },
    manifest: '/manifest.json',
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
        <PostHogProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {/* Logic: Suspense boundary ensures the hook has access to searchParams on all routes */}
            <Suspense fallback={null}>
              <ScrollToTop />
            </Suspense>

            <Suspense fallback={null}>
              <ActivityMonitor />
            </Suspense>
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
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  opacity: 1,
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
        </PostHogProvider>
      </body>
    </html >
  );
}
