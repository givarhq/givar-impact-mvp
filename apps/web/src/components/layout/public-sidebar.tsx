'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Compass, Database, Info, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

export function PublicSidebar() {
    const pathname = usePathname();

    const navItems = [
        { title: 'Explore Causes', href: '/explore', icon: Compass },
        { title: 'Public Records', href: '/records', icon: Database },
        { title: 'How It Works', href: '/how-it-works', icon: HelpCircle },
        { title: 'About Us', href: '/about', icon: Info },
    ];

    return (
        <div className="sticky top-0 h-screen w-full p-3 hidden md:block">
            <div className="h-full flex flex-col gap-2 rounded-3xl bg-card border border-border/40 shadow-sm overflow-hidden">
                {/* Brand Area */}
                <div className="flex h-16 shrink-0 items-center px-5">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5 font-semibold group"
                    >
                        <div className="relative h-8 w-8 overflow-hidden rounded-3xl border border-border bg-background flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            <Image
                                src="/Givar1.png"
                                alt="Givar Logo"
                                width={24}
                                height={24}
                                className="object-contain"
                                priority
                            />
                        </div>
                        <span className="text-lg tracking-tight font-bold text-foreground">
                            Givar<span className="text-primary">.</span>
                        </span>
                    </Link>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-2 overflow-y-auto no-scrollbar">
                    <nav className="grid items-start gap-1 text-sm font-medium w-full">
                        {navItems.map((item, index) => {
                            const Icon = item.icon;
                            // Strict matching to prevent active state bleeding
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                            return (
                                <Link
                                    key={index}
                                    href={item.href}
                                    className={cn(
                                        'group flex items-center gap-3 px-5 py-2.5 transition-all duration-200 w-full',
                                        isActive
                                            ? 'border-l-[3px] border-primary bg-primary/5 text-primary font-bold'
                                            : 'border-l-[3px] border-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            'h-4.5 w-4.5 transition-colors',
                                            isActive
                                                ? 'text-primary'
                                                : 'text-muted-foreground group-hover:text-foreground'
                                        )}
                                    />
                                    {item.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}