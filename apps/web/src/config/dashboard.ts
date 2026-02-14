import { LayoutDashboard, NotebookPen, History, Compass } from 'lucide-react';

export const dashboardNav = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: Compass,
  },
  {
    title: 'Explore',
    href: '/dashboard/impact',
    icon: LayoutDashboard,
  },
  {
    title: 'History',
    href: '/dashboard/history',
    icon: History,
  },
  {
    title: 'Proposals',
    href: '/dashboard/proposals',
    icon: NotebookPen,
  },
];