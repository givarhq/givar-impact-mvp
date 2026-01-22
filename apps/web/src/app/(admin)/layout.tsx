import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminShell } from '../../components/layout/admin-shell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('givar_user');

  if (!userCookie || !userCookie.value) {
    redirect('/login');
  }
  
  let user;
  try {
    user = JSON.parse(userCookie.value);
  } catch (error) {
    redirect('/login');
  }
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <AdminShell>{children}</AdminShell>;
}