import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Compass, ArrowRight, Home, Search } from 'lucide-react';
import { cookies } from 'next/headers';
import { Button } from '../components/ui/button';

export default async function NotFound() {
    // Use server-side cookie detection to prevent hydration loops
    const cookieStore = await cookies();
    const isAuthenticated = !!cookieStore.get('givar_token')?.value;

    // Context-aware routing determined on the server
    const browsePath = isAuthenticated ? '/dashboard/impact' : '/explore';
    const homePath = isAuthenticated ? '/dashboard' : '/';

    return (
        <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">

            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md text-center space-y-10">

                {/* Brand/Logo */}
                <div className="flex justify-center">
                    <Link href={homePath} className="flex items-center gap-2 group">
                        <Image
                            src="/Givar1.png"
                            alt="Givar Logo"
                            width={40}
                            height={40}
                            className="object-contain transition-transform group-hover:rotate-12"
                            priority
                        />
                        <span className="text-2xl font-black tracking-tighter text-foreground">
                            Givar<span className="text-primary">.</span>
                        </span>
                    </Link>
                </div>

                {/* 404 Graphic */}
                <div className="relative inline-block">
                    <div className="h-32 w-32 bg-muted/50 rounded-[40px] flex items-center justify-center border border-border/50 shadow-inner relative overflow-hidden">
                        <Compass className="h-16 w-16 text-primary/20 animate-[spin_10s_linear_infinite]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl font-black text-foreground tracking-tighter">404</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-background rounded-2xl border border-border flex items-center justify-center shadow-xl">
                        <Search className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>

                {/* Messaging */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Lost in the ledger?</h1>
                    <p className="text-muted-foreground leading-relaxed text-sm max-w-xs mx-auto font-medium">
                        We couldn&apos;t find the record or cause you were looking for. The path may have been moved or the link is stale.
                    </p>
                </div>

                {/* Smart Actions */}
                <div className="flex flex-col gap-3 pt-4">
                    <Link href={homePath} className="w-full">
                        <Button size="lg" className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform gap-2">
                            <Home className="h-4 w-4" />
                            {isAuthenticated ? 'Back to Dashboard' : 'Return to Home'}
                        </Button>
                    </Link>

                    <Link href={browsePath} className="w-full">
                        <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground font-semibold gap-2">
                            Browse Verified Causes <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Footer Meta */}
                <div className="pt-12 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                    Error: RESOURCE_NOT_FOUND_ON_LEDGER
                </div>
            </div>
        </div>
    );
}