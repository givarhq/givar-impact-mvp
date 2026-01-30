'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ApiService } from '../../../services/api';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
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

    ApiService.auth.verifyEmail(token)
      .then(() => {
        setStatus('success');
        toast.success('Email verified!');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [token]);

  return (
    <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
      {status === 'verifying' && (
        <div className="py-8 space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Verifying your email...</h1>
          <p className="text-muted-foreground">This will only take a moment.</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-4 space-y-6">
          <div className="mx-auto h-20 w-20 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Email Verified</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account is now fully active. You can now log in and start your impact journey.
            </p>
          </div>
          <Button className="w-full h-12 rounded-xl font-bold" onClick={() => router.push('/login')}>
            Continue to Login <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="py-4 space-y-6">
          <div className="mx-auto h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center">
            <XCircle className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Verification Failed</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The link is invalid or has expired. Please try logging in to request a new one.
            </p>
          </div>
          <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/login')}>
            Back to Login
          </Button>
        </div>
      )}
    </div>
  );
}