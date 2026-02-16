'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    MessageSquare,
    ShieldCheck,
    Clock,
    Check,
    ChevronRight,
    Inbox,
    Zap
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { ApiService } from '../../services/api';
import { formatDate } from '../../lib/utils/format';
import { cn } from '../../lib/utils/cn';

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    MESSAGE: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-50' },
    KYC_STATUS: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    PROPOSAL_STATUS: { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    MILESTONE_ALERT: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-50' },
    SYSTEM: { icon: Bell, color: 'text-zinc-500', bg: 'bg-zinc-50' },
};

export function NotificationBell() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [list, countData] = await Promise.all([
                ApiService.notifications.list(),
                ApiService.notifications.unreadCount()
            ]);
            setNotifications(list || []);
            setUnreadCount(countData?.count || 0);
        } catch (error) {
            console.error("Failed to sync alerts");
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // Pulse every 30s
        return () => clearInterval(interval);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await ApiService.notifications.markAllRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) { /* silent fail */ }
    };

    const handleItemClick = async (notification: any) => {
        if (!notification.isRead) {
            ApiService.notifications.markRead(notification.id);
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        }

        if (notification.link) {
            setIsOpen(false);
            router.push(notification.link);
        }
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button className="relative h-9 w-9 rounded-xl flex items-center justify-center hover:bg-muted transition-all outline-none group">
                    <Bell className={cn(
                        "h-5 w-5 transition-colors",
                        unreadCount > 0 ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className={cn(
  "p-0 overflow-hidden border-border/40 shadow-2xl bg-card/95 backdrop-blur-xl",
  "w-80 rounded-[28px]",
  "sm:w-80",
  "max-sm:w-screen max-sm:rounded-none"
)}>
                <DropdownMenuLabel className="p-4 border-b border-border/40">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-foreground">Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-bold uppercase tracking-wider text-primary hover:underline"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>
                </DropdownMenuLabel>

                <div className="max-h-[380px] overflow-y-auto no-scrollbar">
                    {notifications.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 opacity-40">
                            <Inbox className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs font-medium">Your inbox is clear</p>
                        </div>
                    ) : (
                        notifications.map((n) => {
                            const config = typeConfig[n.type] || typeConfig.SYSTEM;
                            const Icon = config.icon;
                            return (
                                <DropdownMenuItem
                                    key={n.id}
                                    onClick={() => handleItemClick(n)}
                                    className={cn(
                                        "p-4 flex gap-4 cursor-pointer border-b border-border/10 last:border-0 transition-colors",
                                        !n.isRead ? "bg-primary/[0.02]" : "opacity-70"
                                    )}
                                >
                                    <div className={cn("h-9 w-9 rounded-2xl shrink-0 flex items-center justify-center", config.bg, config.color)}>
                                        <Icon className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn("text-xs font-bold truncate", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                                                {n.title}
                                            </p>
                                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                                                {formatDate(n.createdAt).split(',')[0]}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                            {n.content}
                                        </p>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </div>

                <DropdownMenuSeparator className="m-0" />
                <div className="p-3 bg-muted/20 text-center">
                    <button
                        onClick={() => { setIsOpen(false); router.push('/dashboard/settings?tab=activity'); }}
                        className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                        View all activity
                    </button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
