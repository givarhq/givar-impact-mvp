import { cookies } from 'next/headers';
import { LandingHeader } from './landing-header';
import { Footer } from './footer';
import { DashboardShell } from './dashboard-shell';
import { AdminShell } from './admin-shell';
import { ApiService } from '../../services/api';

export async function PublicLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  // Logic: If a session exists, intercept the public layout and wrap the content 
  // in the authenticated shell to maintain navigation state and the standard footer.
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
      // If token is invalid or network fails, fall back gracefully to the guest layout
    }
  }

  // Guest Layout Fallback
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingHeader variant="auth" />

      <main className="flex-1 pt-20">
        {children}
      </main>

      <Footer />
    </div>
  );
}