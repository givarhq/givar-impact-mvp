import { Heart, Library, History, Compass } from 'lucide-react';

export const dashboardNav = [
  {
    title: 'Home',
    href: '/dashboard',
    icon: Compass,
  },
  {
    title: 'Explore',
    href: '/dashboard/impact',
    icon: Heart,
  },
  {
    title: 'My Causes',
    href: '/dashboard/proposals',
    icon: Library,
  },
  {
    title: 'History',
    href: '/dashboard/history',
    icon: History,
  },
];