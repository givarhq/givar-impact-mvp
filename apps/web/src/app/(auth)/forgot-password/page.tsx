'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ApiService } from '../../../services/api';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await ApiService.auth.forgotPassword(data.email);
      setIsSubmitted(true);
      toast.success('Reset link sent!');
    } catch (error) {
      // We don't show specific errors here for security (enumeration)
      setIsSubmitted(true); 
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If an account exists, we've sent a password reset link to your inbox.
          </p>
        </div>
        <Link href="/login" className="block">
          <Button variant="outline" className="w-full rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a recovery link
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          placeholder="name@example.com"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isLoading}
        />

        <Button className="w-full h-11 rounded-xl shadow-lg shadow-primary/20" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
        </Button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm font-medium text-primary hover:underline flex items-center justify-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </Link>
      </div>
    </div>
  );
}