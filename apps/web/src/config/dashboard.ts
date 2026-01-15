import { LayoutDashboard, Heart, History, Settings, Repeat } from 'lucide-react';

export const dashboardNav = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Impact',
    href: '/dashboard/impact',
    icon: Heart,
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
];