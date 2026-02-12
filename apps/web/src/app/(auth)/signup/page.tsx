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
import { Loader2, AlertCircle, Eye, EyeOff, ShieldCheck, UserPlus } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name is too short'),
  lastName: z.string().min(2, 'Last name is too short'),
  email: z.string().email('Provide a valid email address'),
  password: z.string()
    .min(8, 'Minimum 8 characters')
    .regex(/[A-Z]/, 'Require one uppercase')
    .regex(/[0-9]/, 'Require one digit'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password', '');
  const strengthRules = [
    { met: passwordValue.length >= 8 },
    { met: /[A-Z]/.test(passwordValue) },
    { met: /[0-9]/.test(passwordValue) },
    { met: /[^A-Za-z0-9]/.test(passwordValue) },
  ];
  const strengthScore = strengthRules.filter(r => r.met).length;

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await ApiService.auth.signup({ ...data, defaultCurrency: 'NGN' });
      const { accessToken, user } = response;
      setCookie('givar_token', accessToken, { maxAge: 604800, path: '/' });
      setCookie('givar_user', JSON.stringify(user), { maxAge: 604800, path: '/' });
      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message;
      setServerError(Array.isArray(message) ? message[0] : message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 text-center min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">Create an Account</h1>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          Join Givar and start making an impact today.
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 p-4 text-xs font-bold text-destructive bg-destructive/5 border border-destructive/10 rounded-2xl animate-in slide-in-from-top-1 min-w-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="leading-relaxed flex-1 min-w-0">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 min-w-0">
        <div className="grid grid-cols-2 gap-4 min-w-0">
          <Input
            label="First name"
            placeholder="John"
            {...register('firstName')}
            error={errors.firstName?.message}
            disabled={isLoading}
            className="h-11 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
          />
          <Input
            label="Last name"
            placeholder="Doe"
            {...register('lastName')}
            error={errors.lastName?.message}
            disabled={isLoading}
            className="h-11 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
          />
        </div>

        <Input
          label="Email address"
          placeholder="name@example.com"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isLoading}
          className="h-12 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
        />

        <div className="space-y-2 min-w-0">
          <Input
            label="Password"
            placeholder="Min. 8 characters"
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
          {passwordValue.length > 0 && (
            <div className="flex gap-1.5 h-1 px-1 min-w-0">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full flex-1 rounded-3xl transition-all duration-500",
                    i < strengthScore
                      ? (strengthScore <= 2 ? "bg-destructive" : strengthScore === 3 ? "bg-amber-500" : "bg-primary")
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {passwordValue.length > 0 && (
          <Input
            label="Confirm password"
            placeholder="Repeat your password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            className="h-12 rounded-3xl bg-muted/20 border-border/60 focus:bg-background animate-in fade-in slide-in-from-top-1"
          />
        )}

        <Button
          className="w-full h-12 text-sm font-bold rounded-3xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] border-0"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating your account...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </div>
          )}
        </Button>
      </form>

      <div className="space-y-6 min-w-0">

        <div className="text-center min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-primary hover:underline underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}