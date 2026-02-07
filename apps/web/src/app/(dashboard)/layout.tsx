import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardShell } from '../../components/layout/dashboard-shell';
import { ApiService } from '../../services/api';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  const viewMode = cookieStore.get('givar_view_mode')?.value; // 'ADMIN' | 'USER'
  const isImpersonating = cookieStore.get('givar_is_impersonating')?.value === 'true';

  if (!token) {
    redirect('/login');
  }

  const dbUser = await ApiService.auth.getMe(token);

  if (!dbUser) {
    redirect('/api/auth/clear-session');
  }

  // IDENTITY ENFORCEMENT: 
  // If user is an Admin but hasn't explicitly switched to 'USER' mode
  // and isn't currently in a Forensic support session, force them back to Admin.
  if (dbUser.role === 'ADMIN' && viewMode !== 'USER' && !isImpersonating) {
    redirect('/admin');
  }

  return (
    <DashboardShell user={dbUser}>
      {children}
    </DashboardShell>
  );
}