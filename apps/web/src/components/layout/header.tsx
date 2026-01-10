'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Search, CornerDownLeft, Plus, CircleUser, LogOut, Settings, ChevronDown } from 'lucide-react';
import { deleteCookie, getCookie } from 'cookies-next';
import { dashboardNav } from '../../config/dashboard';
import { Button } from '../ui/button';
import { ThemeToggle } from './theme-toggle'; // Import
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  
  const userCookie = getCookie('givar_user');
  const user = userCookie ? JSON.parse(userCookie as string) : null;
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'My Account';
  const displayEmail = user?.email || '';

  const handleLogout = () => {
    deleteCookie('givar_token');
    deleteCookie('givar_user');
    router.push('/login');
  };

  const currentPage = dashboardNav.find(item => item.href === pathname)?.title || 'Overview';

  return (
    <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center gap-4 bg-background/80 px-4 md:px-6 backdrop-blur-xl transition-all border-b border-border/40 md:border-none">
      
      {/* Desktop Title */}
      <div className="hidden md:flex flex-col">
        <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">{currentPage}</h1>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        
        {/* Search */}
        <div className="hidden md:flex items-center rounded-full bg-secondary/50 px-4 py-2.5 transition-colors hover:bg-secondary border border-transparent hover:border-border/50">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-24 lg:w-36 text-foreground"
          />
          <kbd className="ml-2 flex h-5 w-5 items-center justify-center rounded border border-border bg-background text-muted-foreground select-none">
            <CornerDownLeft className="h-3 w-3" />
          </kbd>
        </div>

        {/* Quick Donate */}
        <Button
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hidden md:flex items-center gap-2 h-10 px-4"
          onClick={() => router.push('/dashboard/impact')}
        >
          <Plus className="h-4 w-4" />
          <span>Donate</span>
        </Button>
        
        {/* SOTA Theme Toggle */}
        <ThemeToggle />

        <div className="h-8 w-px bg-border/50 mx-1 hidden md:block" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 rounded-full pl-1 pr-1 md:pr-3 py-1 hover:bg-secondary/50 transition-all outline-none">
              <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border-2 border-background shadow-sm bg-primary/10 flex items-center justify-center text-primary">
                 {user?.firstName ? (
                   <span className="font-bold text-sm">{user.firstName[0]}</span>
                 ) : (
                   <CircleUser className="h-6 w-6" />
                 )}
              </div>
              <div className="hidden text-left md:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground leading-none max-w-[100px] truncate">
                    {displayName}
                  </span>
                </div>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {displayEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/dashboard/settings')}>
               <Settings className="mr-2 h-4 w-4" />
               <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}