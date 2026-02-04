'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setCookie, getCookie } from 'cookies-next';
import { RefreshCcw, ShieldCheck, User } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/cn';
import toast from 'react-hot-toast';

interface ViewModeToggleProps {
    currentRole: string; // From the auth user object
    variant?: 'sidebar' | 'header';
}

export function ViewModeToggle({ currentRole, variant = 'header' }: ViewModeToggleProps) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    // 1. Perspective State Logic
    const viewMode = getCookie('givar_view_mode') || 'ADMIN';
    const isImpersonating = getCookie('givar_is_impersonating') === 'true';

    useEffect(() => {
        setMounted(true);
    }, []);

    // Safety: Only actual admins can see this toggle. 
    // It is hidden during Forensic/Impersonation sessions to prevent identity conflicts.
    if (!mounted || currentRole !== 'ADMIN' || isImpersonating) return null;

    const handleToggle = () => {
        const newMode = viewMode === 'ADMIN' ? 'USER' : 'ADMIN';

        // Persist the choice for the layout middleware and components
        setCookie('givar_view_mode', newMode, { maxAge: 604800, path: '/' });

        const message = newMode === 'USER'
            ? 'Switched to Giver perspective'
            : 'Switched to Admin Console';

        toast.success(message, {
            icon: newMode === 'USER' ? <User className="h-4 w-4 text-primary" /> : <ShieldCheck className="h-4 w-4 text-destructive" />,
            style: { borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }
        });

        // Contextual Routing
        if (newMode === 'USER') {
            router.push('/dashboard');
        } else {
            router.push('/admin');
        }

        // Force a full layout re-validation
        router.refresh();
    };

    if (variant === 'sidebar') {
        return (
            <button
                onClick={handleToggle}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-all group animate-in fade-in slide-in-from-bottom-2"
            >
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-background flex items-center justify-center shadow-sm border border-border/50">
                        <RefreshCcw className="h-4 w-4 text-primary group-hover:rotate-180 transition-transform duration-700 ease-in-out" />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Perspective</span>
                        <span className="text-xs font-bold text-foreground">
                            {viewMode === 'ADMIN' ? 'View as Giver' : 'View as Admin'}
                        </span>
                    </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </button>
        );
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            className={cn(
                "h-9 rounded-xl border-border/50 bg-background/50 font-black text-[9px] uppercase tracking-[0.2em] gap-2 hidden lg:flex transition-all hover:scale-105 active:scale-95",
                viewMode === 'ADMIN' ? "text-primary border-primary/20" : "text-destructive border-destructive/20"
            )}
        >
            <RefreshCcw className="h-3 w-3" />
            {viewMode === 'ADMIN' ? 'View as User' : 'Return to Admin'}
        </Button>
    );
}