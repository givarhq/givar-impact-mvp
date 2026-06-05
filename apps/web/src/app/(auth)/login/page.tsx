'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ApiService } from '../../../services/api';
import { Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, ArrowLeft, Lock, Copy, Check } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginComponent() {
  const posthog = usePostHog();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Step States
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [isMfaSetupStep, setIsMfaSetupStep] = useState(false);

  // Setup States
  const [setupData, setSetupData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState('');
  const [pendingUserId, setPendingUserId] = useState('');
  const [pendingUserEmail, setPendingUserEmail] = useState('');

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

      const { user, accessToken, mfaSetupRequired } = response;

      // Logic: givar_token is securely set via HttpOnly cookie by the Next.js API route.
      // We delegate this to our internal endpoint to bypass cross-domain Set-Cookie restrictions.
      await fetch('/api/auth/clear-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', token: accessToken, user })
      });

      const redirectPath = searchParams.get('redirect');
      const targetUrl = (user.role === 'ADMIN' || user.role === 'SUPERADMIN')
        ? (redirectPath || '/admin')
        : (redirectPath || '/dashboard');

      // Captive Portal: Intercept admins lacking 2FA
      if (mfaSetupRequired) {
        const setupInfo = await ApiService.auth.generate2FA();
        setSetupData(setupInfo);
        setPendingRedirectUrl(targetUrl);
        setPendingUserId(user.id);
        setPendingUserEmail(user.email);
        setIsMfaSetupStep(true);
        setIsLoading(false);
        return;
      }

      // Standard Login Completion
      posthog?.identify(user.id, { email: user.email });
      posthog?.capture('user_login');

      if (typeof window !== 'undefined') {
        localStorage.setItem('givar_last_activity', Date.now().toString());
      }

      window.location.href = targetUrl;
    } catch (error: any) {
      let message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      if (Array.isArray(message)) message = message[0];
      setServerError(message);
      if (isMfaStep) setValue('twoFactorCode', '');
      setIsLoading(false);
    }
  }

  async function handleCompleteMfaSetup() {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await ApiService.auth.enable2FA(setupCode);

      posthog?.identify(pendingUserId, { email: pendingUserEmail });
      posthog?.capture('user_login');
      if (typeof window !== 'undefined') {
        localStorage.setItem('givar_last_activity', Date.now().toString());
      }

      // Optionally handle recovery codes display here, but for login flow we can just let them download it from settings later, 
      // or we just show a quick toast since they are admins and should know best practices.
      if (response.recoveryCodes) {
        console.log('Recovery codes generated:', response.recoveryCodes);
      }

      toast.success('Two-factor authentication successfully enabled.');
      window.location.href = pendingRedirectUrl;
    } catch (error: any) {
      setServerError(error.response?.data?.message || 'Invalid verification code');
      setIsLoading(false);
    }
  }

  const copySecret = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    toast.success("Secret key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 text-center min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
          {isMfaSetupStep ? 'Security Setup Required' : isMfaStep ? 'Two-Factor Authentication' : 'Welcome Back'}
        </h1>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          {isMfaSetupStep
            ? 'Platform policy mandates authenticator protection for your administrative role.'
            : isMfaStep
              ? 'Enter the code from your authenticator app or a backup recovery code.'
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

      {isMfaSetupStep && setupData ? (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 min-w-0">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 bg-white rounded-3xl border border-muted shadow-inner group">
              <motion.img
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={setupData.qrCodeDataUrl}
                alt="2FA QR Code"
                className="w-40 h-40 mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-widest text-muted-foreground ml-2 uppercase">Manual Key</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted/50 p-4 rounded-2xl text-xs font-mono break-all border border-border/40 flex items-center text-foreground font-bold shadow-inner">
                    {setupData.secret}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 shrink-0 rounded-2xl border-border/50 bg-background hover:bg-muted active:scale-90 transition-all"
                    onClick={copySecret}
                  >
                    {copied ? <Check className="h-4.5 w-4.5 text-emerald-500" /> : <Copy className="h-4.5 w-4.5 text-muted-foreground" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold tracking-widest text-primary ml-2 uppercase">Enter 6-Digit Code</label>
                <Input
                  placeholder="000 000"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-3xl bg-muted/20 border-border/60 focus:bg-background shadow-inner"
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 text-sm font-bold rounded-3xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] border-0"
            onClick={handleCompleteMfaSetup}
            disabled={isLoading || setupCode.length !== 6}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Activate Protection & Continue'}
          </Button>
        </div>
      ) : (
        <form method="POST" onSubmit={handleSubmit(onSubmit)} className="space-y-6 min-w-0">
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
                  placeholder="CODE"
                  type="text"
                  {...register('twoFactorCode')}
                  maxLength={8}
                  className="text-center text-2xl font-black tracking-[0.4em] h-14 rounded-3xl bg-muted/20 border-border/60 focus:bg-background uppercase"
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
                  {isMfaStep ? 'Verifying...' : 'Signing in...'}
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
      )}

      {!isMfaStep && !isMfaSetupStep && (
        <div className="space-y-6 min-w-0">
          <div className="relative min-w-0">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-[11px] tracking-[0.2em] font-black">
              <span className="bg-background dark:bg-card px-4 text-muted-foreground/60">Or</span>
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