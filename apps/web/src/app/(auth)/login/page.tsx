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
      if (isMfaStep) {
        if (!data.twoFactorCode || data.twoFactorCode.length !== 6) {
          setServerError("Please enter a valid 6-digit code");
          setIsLoading(false);
          return;
        }
      }

      const response = await ApiService.auth.login(data);

      if (response.mfaRequired) {
        setIsMfaStep(true);
        setIsLoading(false);
        setServerError(null);
        setTimeout(() => setFocus('twoFactorCode'), 100);
        return;
      }

      const { accessToken, user } = response;

      setCookie('givar_token', accessToken, { maxAge: 604800, path: '/' });
      setCookie('givar_user', JSON.stringify(user), { maxAge: 604800, path: '/' });

      const redirectPath = searchParams.get('redirect');

      if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
        router.push(redirectPath || '/admin');
      } else {
        router.push(redirectPath || '/dashboard');
      }

    } catch (error: any) {
      let message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      if (Array.isArray(message)) {
        message = message[0];
      }
      setServerError(message);
      if (isMfaStep) {
        setValue('twoFactorCode', '');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleBackToLogin = () => {
    setIsMfaStep(false);
    setServerError(null);
    setValue('twoFactorCode', '');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {isMfaStep ? 'Two-Factor Authentication' : 'Welcome back'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isMfaStep
            ? 'Enter the 6-digit code from your authenticator app'
            : 'Enter your credentials to access your wallet'
          }
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p className="leading-tight">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {!isMfaStep && (
          <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
            <Input
              label="Email"
              placeholder="name@example.com"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              disabled={isLoading}
            />

            <div className="space-y-1">
              <Input
                label="Password"
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                error={errors.password?.message}
                disabled={isLoading}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>
        )}

        {isMfaStep && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-3xl border border-primary/10">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">{emailValue}</p>
              <p className="text-xs text-muted-foreground mt-1">Secure Session Locked</p>
            </div>

            <div className="space-y-2">
              <Input
                placeholder="000000"
                type="text"
                {...register('twoFactorCode')}
                maxLength={6}
                className="text-center text-2xl font-black tracking-[0.5em] h-14 rounded-2xl"
                autoComplete="one-time-code"
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>
        )}

        <Button
          className="w-full h-11 text-base shadow-lg shadow-primary/20 rounded-xl font-bold"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isMfaStep ? 'Verifying...' : 'Signing In...'}
            </>
          ) : (
            isMfaStep ? 'Verify Identity' : 'Sign In'
          )}
        </Button>

        {isMfaStep && (
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl text-muted-foreground hover:text-foreground"
            onClick={handleBackToLogin}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Use different account
          </Button>
        )}
      </form>

      {!isMfaStep && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground font-medium">Or</span>
            </div>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">New to Givar? </span>
            <Link href="/signup" className="font-bold text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </>
      )}
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginComponent />
    </Suspense>
  )
}