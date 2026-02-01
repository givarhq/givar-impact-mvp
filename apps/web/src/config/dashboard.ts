import { LayoutDashboard, NotebookPen, History, Settings, Repeat } from 'lucide-react';

export const dashboardNav = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
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