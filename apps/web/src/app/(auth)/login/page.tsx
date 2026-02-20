'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { setCookie } from 'cookies-next';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ApiService } from '../../../services/api';
import { Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isMfaStep, setIsMfaStep] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const emailValue = watch('email');

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await ApiService.auth.login(data);

      if (response.mfaRequired) {
        setIsMfaStep(true);
        setIsLoading(false);
        setServerError(null);
        setTimeout(() => setFocus('twoFactorCode'), 100);
        return;
      }

      const { accessToken, user } = response;

      // Persistence logic: 7 days (604800 seconds)
      const cookieOptions = { maxAge: 604800, path: '/', sameSite: 'lax' as const };
      setCookie('givar_token', accessToken, cookieOptions);
      setCookie('givar_user', JSON.stringify(user), cookieOptions);

      const redirectPath = searchParams.get('redirect');
      if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        router.push(redirectPath || '/admin');
      } else {
        router.push(redirectPath || '/dashboard');
      }
    } catch (error: any) {
      let message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      if (Array.isArray(message)) message = message[0];
      setServerError(message);
      if (isMfaStep) setValue('twoFactorCode', '');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 text-center min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
          {isMfaStep ? 'Two-Factor Authentication' : 'Welcome Back'}
        </h1>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          {isMfaStep
            ? 'Enter the 6-digit code from your authenticator app'
            : 'Sign in to manage your campaigns & donations.'
          }
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 p-4 text-xs font-bold text-destructive bg-destructive/5 border border-destructive/10 rounded-2xl animate-in slide-in-from-top-1 min-w-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="leading-relaxed flex-1 min-w-0">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 min-w-0">
        {!isMfaStep ? (
          <div className="space-y-4 animate-in slide-in-from-left-4 duration-300 min-w-0">
            <Input
              label="Email Address"
              placeholder="name@example.com"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
              className="h-12 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
            />

            <div className="space-y-1.5 min-w-0">
              <Input
                label="Password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
                className="h-12 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="flex justify-end px-1">
                <Link
                  href="/forgot-password"
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 min-w-0">
            <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-3xl border border-primary/20 shadow-inner min-w-0">
              <div className="h-14 w-14 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 border border-primary/10">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-foreground truncate max-w-full">{emailValue}</p>
              <p className="text-xs font-bold text-muted-foreground tracking-widest mt-1.5">We just need to confirm it&apos;s you</p>
            </div>

            <div className="space-y-2 min-w-0">
              <Input
                placeholder="000000"
                type="text"
                {...register('twoFactorCode')}
                maxLength={6}
                className="text-center text-2xl font-black tracking-[0.5em] h-14 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
                autoComplete="one-time-code"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        <div className="space-y-3 min-w-0">
          <Button
            className="w-full h-12 text-sm font-bold rounded-3xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] border-0"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isMfaStep ? 'Verifying...' : 'Signing you in...'}
              </>
            ) : (
              isMfaStep ? 'Verify Authentication' : 'Sign In'
            )}
          </Button>

          {isMfaStep && (
            <button
              type="button"
              className="w-full h-10 rounded-3xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2"
              onClick={() => { setIsMfaStep(false); setServerError(null); }}
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4" /> Use different account
            </button>
          )}
        </div>
      </form>

      {!isMfaStep && (
        <div className="space-y-6 min-w-0">
          <div className="relative min-w-0">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-[11px]  tracking-[0.2em] font-black">
              <span className="bg-background px-4 text-muted-foreground/60">Or</span>
            </div>
          </div>

          <div className="text-center min-w-0">
            <p className="text-sm font-medium text-muted-foreground">
              New to the platform?{' '}
              <Link href="/signup" className="font-bold text-primary hover:underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center min-w-0"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginComponent />
    </Suspense>
  )
}