'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ApiService } from '../../../services/api';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain one letter')
    .regex(/[0-9]/, 'Must contain one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { token } = use(searchParams);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!token) return toast.error('Invalid or missing recovery link.');

    setIsLoading(true);
    try {
      await ApiService.auth.resetPassword({
        token,
        password: data.password,
      });
      toast.success('Your password has been updated.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || "We couldn't reset your password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full min-w-0 space-y-6 text-center animate-in fade-in duration-500">
        <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-[24px] flex items-center justify-center mx-auto border border-destructive/20">
          <Lock className="h-8 w-8" />
        </div>
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Link Expired</h1>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed">This password reset link is invalid or has already been used.</p>
        </div>
        <Button variant="outline" onClick={() => router.push('/forgot-password')} className="w-full h-12 rounded-3xl font-bold text-xs tracking-widest border-border/60">
          Request new link
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 text-center min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground leading-tight">Reset Password</h1>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          Choose a new password for your account.
        </p>
      </div>

      <form method="POST" onSubmit={handleSubmit(onSubmit)} className="space-y-5 min-w-0">
        <Input
          label="New password"
          placeholder="••••••••"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          disabled={isLoading}
          className="h-12 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
        />

        <Input
          label="Confirm new password"
          placeholder="••••••••"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          disabled={isLoading}
          className="h-12 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
        />

        <Button
          className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98] border-0 gap-2"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Update password
        </Button>
      </form>
    </div>
  );
}