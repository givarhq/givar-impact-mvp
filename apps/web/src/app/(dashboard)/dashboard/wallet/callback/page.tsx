'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import { ApiService } from '../../../../../services/api';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const reference = searchParams.get('reference');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (reference && !hasVerified.current) {
      hasVerified.current = true;
      ApiService.wallet.verifyTransaction(reference)
        .then((res) => {
          if (res.status === 'success' || res.data?.status === 'success') {
            setStatus('success');
          } else {
            setStatus('error');
          }
        })
        .catch(() => setStatus('error'));
    } else if (!reference) {
      setStatus('error');
    }
  }, [reference]);

  return (
    <CardContent className="p-10 space-y-8">
      {status === 'loading' && (
        <div className="space-y-4 py-8 flex flex-col items-center">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <h2 className="text-xl font-bold text-foreground">Verifying Deposit...</h2>
          <p className="text-muted-foreground text-sm">Communicating with Paystack nodes.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-6 py-4 animate-in zoom-in-95 duration-500">
          <div className="h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-500/5">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Deposit Successful</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Your funds have been verified and added to your ledger.
            </p>
          </div>
          <div className="pt-4">
            <Link href="/dashboard">
              <Button className="w-full h-14 rounded-2xl font-bold text-base shadow-lg shadow-primary/20">
                Back to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-6 py-4 animate-in zoom-in-95 duration-500">
          <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
            <XCircle className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Verification Failed</h2>
          <p className="text-muted-foreground text-sm">We couldn&apos;t confirm your payment. If you were debited, please contact support.</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full h-12 rounded-xl">Return to Dashboard</Button>
        </div>
      )}
    </CardContent>
  );
}

export default function WalletCallbackPage() {
  return (
    <div className="max-w-md mx-auto pt-12 text-center">
      <Card className="border-border/50 shadow-2xl rounded-3xl overflow-hidden bg-card/50 backdrop-blur-xl">
        <Suspense fallback={
          <div className="p-20 flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
          </div>
        }>
          <CallbackContent />
        </Suspense>
      </Card>
    </div>
  );
}