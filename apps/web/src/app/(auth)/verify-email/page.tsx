'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService } from '../../../services/api';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { getCookie } from 'cookies-next';
import toast from 'react-hot-toast';

export default function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const router = useRouter();
  const { token } = use(searchParams);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    const performVerification = async () => {
      try {
        await ApiService.auth.verifyEmail(token);

        // If the user is already logged in, refresh their profile cookie immediately
        const existingToken = getCookie('givar_token');
        if (existingToken) {
          await ApiService.auth.getMe();
        }

        setStatus('success');
        toast.success('Email verified successfully');
      } catch (error) {
        setStatus('error');
      }
    };

    performVerification();
  }, [token]);

  return (
    <div className="w-full min-w-0 space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
      {status === 'verifying' && (
        <div className="py-8 space-y-6 min-w-0">
          <div className="relative h-16 w-16 mx-auto">
            <Loader2 className="h-16 w-16 text-primary animate-spin opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Verifying Email</h1>
            <p className="text-sm text-muted-foreground font-medium">Please wait while we confirm your address.</p>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="py-4 space-y-8 min-w-0">
          <div className="mx-auto h-20 w-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center border border-primary/20 shadow-inner">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Email Verified</h1>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
              Your account is now fully active. You can now sign in and start your impact journey.
            </p>
          </div>
          <Button className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] border-0 gap-2" onClick={() => router.push('/login')}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="py-4 space-y-8 min-w-0">
          <div className="mx-auto h-20 w-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center border border-destructive/20 shadow-inner">
            <XCircle className="h-10 w-10" />
          </div>
          <div className="space-y-2 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Verification Failed</h1>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
              The link is invalid or has expired. Please sign in to request a new verification email.
            </p>
          </div>
          <Button variant="outline" className="w-full h-12 rounded-3xl font-bold text-xs tracking-widest border-border/60 active:scale-[0.98]" onClick={() => router.push('/login')}>
            Back to sign in
          </Button>
        </div>
      )}
    </div>
  );
}