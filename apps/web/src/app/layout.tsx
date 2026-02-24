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
                background: 'hsl(var(--card))', // Explicit opaque background via HSL variable
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', // Solid shadow for depth
                opacity: 1, // Force absolute opacity
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
