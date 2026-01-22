import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminSidebar } from '../../components/layout/admin-sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('givar_user');

  // 1. Check existence
  if (!userCookie || !userCookie.value) {
    redirect('/login');
  }
  
  let user;
  try {
    // 2. Safe Parse
    user = JSON.parse(userCookie.value);
  } catch (error) {
    // If JSON is invalid (e.g. "undefined" string), force re-login
    redirect('/login');
  }
  
  // 3. Strict RBAC Check
  if (!user || user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 bg-zinc-900 m-2 rounded-2xl border border-zinc-800">
        {children}
      </main>
    </div>
  );
}