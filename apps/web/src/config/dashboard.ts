import { LayoutDashboard, NotebookPen, History, Settings, Repeat, Compass } from 'lucide-react';

export const dashboardNav = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Explore',
    href: '/dashboard/impact',
    icon: Compass,
  },
  {
    title: 'History',
    href: '/dashboard/history',
    icon: History,
  },
  {
    title: 'Subscriptions',
    href: '/dashboard/subscriptions',
    icon: Repeat,
  },
  {
    title: 'Proposals',
    href: '/dashboard/proposals',
    icon: NotebookPen,
  },
];