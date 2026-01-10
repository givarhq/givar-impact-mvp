import { LayoutDashboard, Heart, History, Settings } from 'lucide-react';

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
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];