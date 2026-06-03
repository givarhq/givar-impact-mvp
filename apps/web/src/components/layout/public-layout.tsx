import { cookies } from 'next/headers';
import { LandingHeader } from './landing-header';
import { Footer } from './footer';
import { DashboardShell } from './dashboard-shell';
import { AdminShell } from './admin-shell';
import { ApiService } from '../../services/api';
import { LegalUpdateBanner } from './legal-update-banner';

export async function PublicLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingHeader variant="auth" />

      <main className="flex-1 pt-20">
        <LegalUpdateBanner />
        {children}
      </main>

      <Footer />
    </div>
  );
}