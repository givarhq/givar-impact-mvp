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

  if (!token) {
    redirect('/login');
  }

  const dbUser = await ApiService.auth.getMe(token);

  if (!dbUser) {
    redirect('/api/auth/clear-session');
  }

  return (
    <DashboardShell user={dbUser}>
      {children}
    </DashboardShell>
  );
}