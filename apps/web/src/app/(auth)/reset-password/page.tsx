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
    .regex(/[A-Z]/, 'Must contain one uppercase letter')
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
    if (!token) return toast.error('Invalid or missing reset token.');
    
    setIsLoading(true);
    try {
      await ApiService.auth.resetPassword({
        token,
        password: data.password,
      });
      toast.success('Password updated! Please log in.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <Lock className="h-12 w-12 text-destructive mx-auto opacity-20" />
        <h1 className="text-xl font-bold">Invalid Link</h1>
        <p className="text-sm text-muted-foreground">This reset link is invalid or has expired.</p>
        <Button variant="outline" onClick={() => router.push('/forgot-password')} className="w-full rounded-xl">Request New Link</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
        <p className="text-sm text-muted-foreground">
          Enter a strong, unique password to secure your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New Password"
          placeholder="••••••••"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          disabled={isLoading}
        />

        <Input
          label="Confirm New Password"
          placeholder="••••••••"
          type="password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          disabled={isLoading}
        />

        <Button className="w-full h-11 rounded-xl shadow-lg shadow-primary/20 gap-2" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Update Password
        </Button>
      </form>
    </div>
  );
}