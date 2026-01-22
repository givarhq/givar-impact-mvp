import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminSidebar } from '../../components/layout/admin-sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('givar_user')?.value;
  
  if (!userCookie) redirect('/login');
  
  const user = JSON.parse(userCookie);
  if (user.role !== 'ADMIN') redirect('/dashboard'); // Strict RBAC Redirect

  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-8 bg-zinc-900 m-2 rounded-2xl border border-zinc-800">
        {children}
      </main>
    </div>
  );
}