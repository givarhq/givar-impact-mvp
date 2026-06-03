'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import Link from 'next/link';

export function LegalUpdateBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const BANNER_VERSION = 'givar_legal_banner_v2'; // Bumped version to reset dismissal for the new design

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
        <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-3 relative z-[60] animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3 text-sm text-foreground font-medium w-full">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5 sm:mt-0 shadow-inner">
                        <FileText className="h-4 w-4" />
                    </div>
                    <p className="text-xs sm:text-sm leading-relaxed pr-2">
                        We have updated our <Link href="/legal/terms" className="font-bold text-primary hover:underline transition-colors" onClick={dismiss}>Terms of Service</Link> and <Link href="/legal/privacy" className="font-bold text-primary hover:underline transition-colors" onClick={dismiss}>Privacy Policy</Link>.
                    </p>
                </div>

                <div className="flex items-center shrink-0">
                    <button
                        onClick={dismiss}
                        className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground active:scale-95 bg-background/50 border border-border/40 sm:bg-transparent sm:border-transparent"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}