import { cookies } from 'next/headers';
import { LandingHeader } from './landing-header';
import { Footer } from './footer';
import { DashboardShell } from './dashboard-shell';
import { AdminShell } from './admin-shell';
import { ApiService } from '../../services/api';
import { LegalUpdateBanner } from './legal-update-banner';
import { PublicSidebar } from './public-sidebar';

interface PublicLayoutProps {
  children: React.ReactNode;
  variant?: 'default' | 'app';
}

export async function PublicLayout({ children, variant = 'default' }: PublicLayoutProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  // Render Authenticated Shell if user session exists
  if (token) {
    try {
      const user = await ApiService.auth.getMe(token);
      if (user) {
        const viewMode = cookieStore.get('givar_view_mode')?.value;
        const isImpersonating = cookieStore.get('givar_is_impersonating')?.value === 'true';
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
        const shouldBeInAdminEnv = isAdmin && viewMode !== 'USER' && !isImpersonating;

        if (shouldBeInAdminEnv) {
          return <AdminShell user={user}>{children}</AdminShell>;
        } else {
          return <DashboardShell user={user}>{children}</DashboardShell>;
        }
      }
    } catch (error) {
      // Fallback gracefully to guest layout if session check fails
    }
  }

  // App-Like Guest Shell (Discovery, Details, Records)
  if (variant === 'app') {
    return (
      <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-200">
        <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr]">
          <div className="hidden md:block sticky top-0 h-screen overflow-hidden">
            <PublicSidebar />
          </div>

          <div className="flex flex-col min-w-0">
            <LandingHeader variant="app" />
            <LegalUpdateBanner />

            <main className="flex-1 px-4 py-4 md:px-8 md:py-6 pb-24 md:pb-8 overflow-x-hidden">
              <div className="mx-auto w-full max-w-6xl">
                {children}
              </div>
            </main>

            <Footer />
          </div>
        </div>
      </div>
    );
  }

  // Traditional Marketing Shell (Home, About, Contact)
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingHeader variant="default" />

      <main className="flex-1 pt-20">
        <LegalUpdateBanner />
        {children}
      </main>

      <Footer />
    </div>
  );
}