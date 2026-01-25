'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight, Loader2, ShieldCheck, Heart } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { ApiService } from '../../../services/api';
import { PublicLayout } from '../../../components/layout/public-layout';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const reference = searchParams.get('reference');
  const attempts = useRef(0);
  const MAX_ATTEMPTS = 5;

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const res = await ApiService.wallet.verifyTransaction(reference);
        if (res.status === 'success') {
          setStatus('success');
        } else if (attempts.current < MAX_ATTEMPTS) {
          attempts.current++;
          setTimeout(verify, 1500 * attempts.current); 
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };

    verify();
  }, [reference]);

  return (
    <CardContent className="p-8 md:p-12 space-y-10">
      {status === 'loading' && (
        <div className="space-y-6 py-10 flex flex-col items-center text-center">
          <div className="relative">
            <Loader2 className="h-16 w-16 text-primary animate-spin opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Verifying Ledger...</h2>
            <p className="text-muted-foreground text-sm max-w-[240px]">
                Synchronizing your transaction with the Givar protocol nodes.
            </p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-8 py-4 animate-in zoom-in-95 duration-500 text-center">
          <div className="relative inline-block">
             <div className="h-24 w-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto ring-8 ring-primary/5">
                <CheckCircle2 className="h-12 w-12" />
             </div>
             <div className="absolute -top-1 -right-1 h-8 w-8 bg-background rounded-full border border-border flex items-center justify-center shadow-sm">
                <Heart className="h-4 w-4 text-rose-500 fill-current" />
             </div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tighter text-foreground">Mission Accomplished</h2>
            <p className="text-muted-foreground leading-relaxed text-sm max-w-xs mx-auto">
              Your contribution has been successfully verified and added to the immutable impact ledger.
            </p>
          </div>

          <div className="pt-4 grid gap-3">
            <Link href="/dashboard">
              <Button className="w-full h-14 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-8 py-4 animate-in zoom-in-95 duration-500 text-center">
          <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Sync Unsuccessful</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed">
              We couldn&apos;t confirm this payment reference instantly. Don&apos;t worry, your funds are safe. Please check back in a few minutes.
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-xl border border-border text-[10px] font-mono opacity-60 truncate">
             REF: {reference}
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full h-12 rounded-2xl border-border">Dismiss</Button>
        </div>
      )}
    </CardContent>
  );
}

export default function GlobalCallbackPage() {
  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-6 relative">
        {/* Background Decorative Blur */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        
        <Card className="w-full max-w-[440px] border-border/50 shadow-2xl rounded-[32px] overflow-hidden bg-card/50 backdrop-blur-2xl relative z-10">
          <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>}>
            <CallbackContent />
          </Suspense>
        </Card>
      </div>
    </PublicLayout>
  );
}