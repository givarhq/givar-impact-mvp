'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, ShieldAlert, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import { Button } from '../ui/button';
import { deleteCookie } from 'cookies-next';
import { useRouter } from 'next/navigation';

const navItems = [
  { title: 'Overview', href: '/admin', icon: LayoutDashboard },
  { title: 'Users', href: '/admin/users', icon: Users },
  { title: 'Projects', href: '/admin/projects', icon: FileText },
  { title: 'Audit Log', href: '/admin/audit', icon: ShieldAlert },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    deleteCookie('givar_token');
    deleteCookie('givar_user');
    router.push('/login');
  };

  return (
    <aside className="w-64 flex flex-col border-r border-zinc-800 bg-zinc-950 p-4">
      <div className="h-16 flex items-center px-4 mb-6">
        <span className="text-xl font-bold tracking-tight text-white">
            Givar <span className="text-red-500 text-xs uppercase ml-1 border border-red-500/50 px-1 rounded">Admin</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-zinc-800">
        <Button 
            variant="ghost" 
            className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
            onClick={handleLogout}
        >
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </aside>
  );
}