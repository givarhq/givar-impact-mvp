import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardShell } from '../../components/layout/dashboard-shell';
import { ApiService } from '../../services/api';
import { IdentitySync } from '../../components/layout/identity-sync';
import { VerificationBanner } from '../../components/layout/verification-banner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) {
    // This redirect is fine, as it's for unauthenticated users.
    redirect('/login');
  }

  const dbUser = await ApiService.auth.getMe(token);

  if (!dbUser) {
    // This clears the invalid session & redirects correctly.
    redirect('/api/auth/clear-session');
  }

  return (
    <>
      <IdentitySync user={dbUser} />
      <VerificationBanner user={dbUser} />
      <DashboardShell user={dbUser}>
        {children}
      </DashboardShell>
    </>
  );
}