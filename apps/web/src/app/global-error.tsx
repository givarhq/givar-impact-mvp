'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { ShieldAlert, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Logic: Ignore expected unmount/network drop errors from Sentry logging
        if (error.message !== 'Connection closed.') {
            Sentry.captureException(error);
        }
    }, [error]);

    return (
        <html lang="en">
            <body className="bg-background text-foreground min-h-screen flex items-center justify-center p-6 antialiased selection:bg-primary/20">
                <div className="w-full max-w-md text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-[24px] flex items-center justify-center mx-auto border border-destructive/20 shadow-inner">
                        <ShieldAlert className="h-10 w-10" />
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl font-black tracking-tight text-foreground">System Exception</h1>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
                            A critical fault was detected and securely reported to the platform team.
                        </p>
                    </div>
                    <div className="flex justify-center">
                        <Button
                            onClick={() => reset()}
                            className="w-auto h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/10 active:scale-[0.98] transition-all border-0 gap-2"
                        >
                            <RefreshCcw className="h-4 w-4" /> Recover Session
                        </Button>
                    </div>

                    <div className="pt-8 text-xs font-black tracking-[0.3em] text-muted-foreground/30 uppercase">
                        Error Digest: {error.digest || 'UNKNOWN_FAULT'}
                    </div>
                </div>
            </body>
        </html>
    );
}