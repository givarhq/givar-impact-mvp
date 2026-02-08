'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie, getCookie } from 'cookies-next';
import { ShieldCheck, User } from 'lucide-react';
import { cn } from '../../lib/utils/cn';
import toast from 'react-hot-toast';

interface ViewModeToggleProps {
    currentRole: string;
    variant?: 'sidebar' | 'header';
}

export function ViewModeToggle({ currentRole, variant = 'header' }: ViewModeToggleProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    const viewMode = getCookie('givar_view_mode') || 'ADMIN';
    const isImpersonating = getCookie('givar_is_impersonating') === 'true';

    useEffect(() => {
        setMounted(true);
    }, []);

    // Superadmins and Admins can both toggle perspectives. 
    // Hidden during Impersonation to prevent session collisions.
    if (!mounted || !['ADMIN', 'SUPERADMIN'].includes(currentRole) || isImpersonating) return null;

    const isSuperAdmin = currentRole === 'SUPERADMIN';

    const handleToggle = () => {
        const newMode = viewMode === 'ADMIN' ? 'USER' : 'ADMIN';
        setCookie('givar_view_mode', newMode, { maxAge: 604800, path: '/' });

        toast.success(newMode === 'USER' ? 'Viewing as Giver' : 'Switched to Admin Console', {
            icon: newMode === 'USER' ? <User className="h-4 w-4 text-primary" /> : <ShieldCheck className="h-4 w-4 text-destructive" />,
            style: { borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }
        });

        router.push(newMode === 'USER' ? '/dashboard' : '/admin');
        router.refresh();
    };

    if (variant === 'sidebar') {
        return (
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shadow-sm border",
                        isSuperAdmin ? "bg-purple-500/10 border-purple-500/20 text-purple-600" : "bg-primary/10 border-primary/20 text-primary"
                    )}>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Perspective</span>
                        <span className="text-xs font-bold text-foreground">
                            {viewMode === 'ADMIN' ? 'Giver Mode' : isSuperAdmin ? 'Superadmin Mode' : 'Admin Mode'}
                        </span>
                    </div>
                </div>
            </button>
        );
    }

    return (
        <button
            onClick={handleToggle}
            className={cn(
                "hidden lg:flex items-center text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 shadow-sm",
                viewMode === 'USER'
                    ? "bg-primary/10 text-primary border-primary/20"
                    : isSuperAdmin
                        ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                        : "bg-destructive/10 text-destructive border-destructive/20"
            )}
        >
            <div className={cn(
                "h-1.5 w-1.5 rounded-full animate-pulse mr-2",
                viewMode === 'USER' ? "bg-primary" : isSuperAdmin ? "bg-purple-500" : "bg-destructive"
            )} />
            {viewMode === 'USER'
                ? (isSuperAdmin ? 'View as Superadmin' : 'View as Admin') : 'View as User'}
        </button>
    );
}