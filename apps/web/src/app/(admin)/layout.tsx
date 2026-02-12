import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminShell } from '../../components/layout/admin-shell';
import { ApiService } from '../../services/api';
import { IdentitySync } from '../../components/layout/identity-sync';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const dbUser = await ApiService.auth.getMe(token);

  if (!dbUser || !['ADMIN', 'SUPERADMIN'].includes(dbUser.role)) {
    redirect('/dashboard');
  }

  return (
    <>
      <IdentitySync user={dbUser} />
      <AdminShell user={dbUser}>{children}</AdminShell>
    </>
  );
}