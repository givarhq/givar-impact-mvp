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
import { apiClient } from '../../../lib/api-client';
import toast from 'react-hot-toast';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', data);
      const { accessToken, user } = response.data;
      
      // Set cookie securely
      setCookie('givar_token', accessToken, { maxAge: 86400 }); // 1 day
      setCookie('givar_user', JSON.stringify(user), { maxAge: 86400 });

      toast.success(`Welcome back, ${user.firstName}!`);
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="text-sm text-slate-500">
          Enter your email below to login to your account
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="name@example.com"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
        </div>
        <div className="space-y-2">
          <Input
            placeholder="Password"
            type="password"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>
        <Button className="w-full" type="submit" isLoading={isLoading}>
          Sign In
        </Button>
      </form>
      <div className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="underline hover:text-slate-900">
          Sign up
        </Link>
      </div>
    </div>
  );
}