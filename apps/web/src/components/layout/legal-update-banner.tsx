'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function LegalUpdateBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const BANNER_VERSION = 'givar_legal_banner_v1';

    useEffect(() => {
        if (!localStorage.getItem(BANNER_VERSION)) {
            setIsVisible(true);
        }
    }, []);

    if (!isVisible) return null;

    const dismiss = () => {
        localStorage.setItem(BANNER_VERSION, 'true');
        setIsVisible(false);
    };

    return (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-3 relative z-50 animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-sm text-foreground font-medium w-full sm:w-auto">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                        <FileText className="h-4 w-4" />
                    </div>
                    <p className="text-xs sm:text-sm">
                        We have updated our <Link href="/legal/terms" className="font-bold text-primary hover:underline">Terms of Service</Link> and <Link href="/legal/privacy" className="font-bold text-primary hover:underline">Privacy Policy</Link>.
                    </p>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-end">
                    <Link
                        href="/legal/terms"
                        onClick={dismiss}
                        className="flex items-center justify-center gap-1.5 text-xs font-bold bg-primary text-white px-5 py-2 rounded-full hover:bg-primary/90 transition-all whitespace-nowrap shadow-sm active:scale-95"
                    >
                        View <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                        onClick={dismiss}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground bg-background/50 border border-border/40 sm:bg-transparent sm:border-transparent active:scale-95"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}