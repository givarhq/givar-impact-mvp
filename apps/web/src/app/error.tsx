'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Logic: Actively pipe page-level rendering exceptions to Sentry
        console.error("Page-level exception caught:", error);
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-[24px] flex items-center justify-center mx-auto mb-6 border border-destructive/20 shadow-inner">
                <ShieldAlert className="h-10 w-10" />
            </div>

            <div className="space-y-3 mb-8">
                <h1 className="text-2xl font-black tracking-tight text-foreground">An error occured</h1>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[320px] mx-auto">
                    A component failed to render. The error has been securely logged for review.
                </p>
            </div>

            <div className="flex justify-center">
                <Button
                    onClick={() => reset()}
                    className="h-12 px-8 rounded-3xl font-bold text-sm w-auto shadow-lg shadow-primary/10 active:scale-[0.98] transition-all border-0 gap-2"
                >
                    <RefreshCcw className="h-4 w-4" /> Try Again
                </Button>
            </div>

            {error.digest && (
                <div className="mt-8 text-[10px] font-mono  text-muted-foreground/40 uppercase">
                    Ref: {error.digest}
                </div>
            )}
        </div>
    );
}