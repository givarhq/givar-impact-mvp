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
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
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
      
      setCookie('givar_token', accessToken, { maxAge: 86400 });
      setCookie('givar_user', JSON.stringify(user), { maxAge: 86400 });

      toast.success('Successfully logged in');
      router.push('/dashboard');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your wallet
        </p>
      </div>

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
            type="password"
            {...register('password')}
            error={errors.password?.message}
            disabled={isLoading}
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

        <Button className="w-full h-11 text-base shadow-lg shadow-primary/20" type="submit" disabled={isLoading}>
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
          <span className="bg-card px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">New to Givar? </span>
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}