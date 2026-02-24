'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight, Loader2, ShieldCheck, Wallet, Heart } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { ApiService } from '../../../services/api';
import { PublicLayout } from '../../../components/layout/public-layout';
import { getCookie } from 'cookies-next';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [result, setResult] = useState<any>(null);
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
          setResult(res);
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

  // Logic: Identify authentication status to prevent middleware redirection loops
  const token = getCookie('givar_token');
  const isAuthenticated = !!token;

  return (
    <CardContent className="p-8 md:p-12 space-y-10 min-w-0">
      {status === 'loading' && (
        <div className="space-y-6 py-10 flex flex-col items-center text-center min-w-0">
          <div className="relative h-16 w-16">
            <Loader2 className="h-16 w-16 text-primary animate-spin opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Confirming Payment</h2>
            <p className="text-muted-foreground text-sm max-w-[240px] font-medium leading-relaxed">
              Updating the ledger with the latest transaction data.
            </p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-8 py-4 animate-in zoom-in-95 duration-500 text-center min-w-0">
          <div className="relative inline-block">
            <div className="h-24 w-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto ring-8 ring-primary/5 border border-primary/20 shadow-inner">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <div className="absolute -top-1 -right-1 h-9 w-9 bg-background rounded-2xl border border-border/40 flex items-center justify-center shadow-md">
              {result?.type === 'DIRECT_DONATION' ? (
                <Heart className="h-4 w-4 text-primary fill-current" />
              ) : (
                <Wallet className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-3 min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {result?.type === 'DIRECT_DONATION' ? 'Impact Secured' : 'Wallet Funded'}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-sm max-w-xs mx-auto font-medium">
              {result?.type === 'DIRECT_DONATION'
                ? `Your contribution to "${result.project?.title || 'this cause'}" has been verified! Thank you for your generosity.`
                : 'Your transfer was successful. The funds are now available in your wallet.'}
            </p>
          </div>

          <div className="pt-4 w-full min-w-0">
            {result?.type === 'DIRECT_DONATION' && result?.project?.slug ? (
              <Link
                href={isAuthenticated ? `/dashboard/impact/${result.project.slug}` : `/explore/${result.project.slug}`}
                className="block w-full"
              >
                <Button className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform border-0">
                  Return to Cause <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href={isAuthenticated ? "/dashboard" : "/login"} className="block w-full">
                <Button className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform border-0">
                  {isAuthenticated ? "Go to Dashboard" : "Sign In"} <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-8 py-4 animate-in zoom-in-95 duration-500 text-center min-w-0">
          <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto border border-destructive/20 shadow-inner">
            <XCircle className="h-10 w-10" />
          </div>
          <div className="space-y-2 min-w-0">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Sync Unsuccessful</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed font-medium">
              We couldn&apos;t confirm this payment instantly. Don&apos;t worry, your funds are safe. Please check your history in a few minutes.
            </p>
          </div>
          <div className="p-3 bg-muted/50 rounded-2xl border border-border/40 text-[10px] font-mono text-muted-foreground truncate  tracking-tighter">
            Ref: {reference}
          </div>
          <Button variant="outline" onClick={() => router.push(isAuthenticated ? '/dashboard' : '/')} className="w-full h-12 rounded-3xl border-border/60 font-bold text-xs  tracking-widest active:scale-[0.98]">Dismiss</Button>
        </div>
      )}
    </CardContent>
  );
}

export default function GlobalCallbackPage() {
  return (
    <PublicLayout>
      <div className="min-h-[80vh] flex items-center justify-center p-6 relative min-w-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg aspect-square bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <Card className="w-full max-w-[440px] border-border/40 shadow-2xl rounded-3xl overflow-hidden bg-card/50 backdrop-blur-2xl relative z-10 min-w-0">
          <Suspense fallback={<div className="p-20 flex justify-center min-w-0"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>}>
            <CallbackContent />
          </Suspense>
        </Card>
      </div>
    </PublicLayout>
  );
}