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
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Requires uppercase')
    .regex(/[0-9]/, 'Requires a number'),
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
      const response = await ApiService.auth.signup({
        ...data,
        defaultCurrency: 'NGN',
      });

      const { accessToken, refreshToken, user } = response;

      setCookie('givar_token', accessToken, { maxAge: 86400 });
      setCookie('givar_refresh_token', refreshToken, { maxAge: 604800 });
      setCookie('givar_user', JSON.stringify(user), { maxAge: 86400 });

      router.push('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.message;
      if (Array.isArray(message)) {
        setServerError(message[0]);
      } else {
        setServerError(message || 'Registration failed. Please check your details.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Join Givar to start your impact journey
        </p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="John"
            {...register('firstName')}
            error={errors.firstName?.message}
            disabled={isLoading}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            {...register('lastName')}
            error={errors.lastName?.message}
            disabled={isLoading}
          />
        </div>

        <Input
          label="Email"
          placeholder="name@example.com"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <div className="space-y-2">
          <Input
            label="Password"
            placeholder="Min. 8 characters"
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
          {passwordValue.length > 0 && (
            <div className="flex gap-1 h-1 px-0.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-full flex-1 rounded-full transition-all duration-300",
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
            label="Confirm Password"
            placeholder="Repeat your password"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            disabled={isLoading}
            className="animate-in fade-in slide-in-from-top-2 duration-300"
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="hover:text-foreground transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        )}

        <div className="pt-2">
          <Button className="w-full h-11 text-base shadow-lg shadow-primary/20" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}