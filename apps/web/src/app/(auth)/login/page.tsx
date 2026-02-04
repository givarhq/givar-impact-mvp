'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { setCookie } from 'cookies-next';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { Loader2, AlertCircle, Mail, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setServerError(null);
    setUnverifiedEmail(null);

    try {
      const { accessToken, user } = await ApiService.auth.login(data);

      setCookie('givar_token', accessToken, { maxAge: 604800 });
      setCookie('givar_user', JSON.stringify(user), { maxAge: 604800 });

      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';

      if (message === 'EMAIL_NOT_VERIFIED') {
        setServerError('Your email address has not been verified.');
        setUnverifiedEmail(data.email);
      } else {
        setServerError(message);
      }

    } finally {
      setIsLoading(false);
    }
  }

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setIsResending(true);
    try {
      await ApiService.auth.resendVerification(unverifiedEmail);
      toast.success('New verification link sent to your inbox');
      setServerError(null);
      setUnverifiedEmail(null);
    } catch (error) {
      toast.error('Failed to resend link. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your wallet
        </p>
      </div>

      {serverError && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{serverError}</p>
          </div>

          {unverifiedEmail && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Verification is required for financial security. Didn&apos;t get the link?
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 rounded-lg text-xs font-bold gap-2 border-primary/20 text-primary hover:bg-primary/10"
                onClick={handleResend}
                disabled={isResending}
              >
                {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                Resend Verification Link
              </Button>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <Button className="w-full h-11 text-base shadow-lg shadow-primary/20 rounded-xl" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

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
    </div>
  );
}