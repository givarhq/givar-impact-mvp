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

// SOTA Validation Schema
const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);
    try {
      // Register User
      await apiClient.post('/auth/signup', {
        ...data,
        defaultCurrency: 'NGN',
      });

      toast.success('Account created! Logging you in...');

      // Auto-Login immediately
      const loginResponse = await apiClient.post('/auth/login', {
        email: data.email,
        password: data.password,
      });

      const { accessToken, user } = loginResponse.data;
      
      setCookie('givar_token', accessToken, { maxAge: 86400 });
      setCookie('givar_user', JSON.stringify(user), { maxAge: 86400 });

      router.push('/dashboard');
    } catch (error: any) {
      // API error handling
      const msg = error?.response?.data?.message;
      if (msg && msg.includes('Email')) {
         toast.error('This email is already registered.');
      } else {
         console.error(error);
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
        
        <Input
          label="Password"
          placeholder="Min. 8 characters"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          disabled={isLoading}
        />

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