'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ApiService } from '../../../services/api';
import { Loader2, ArrowLeft, CheckCircle2, Mail, Send } from 'lucide-react';
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
      toast.success('Password reset link sent');
    } catch (error) {
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full min-w-0 space-y-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto h-20 w-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center border border-primary/20 shadow-inner">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-2 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Check Your Email</h1>
          <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[280px] mx-auto">
            If an account exists with that email, we’ve sent password reset instructions to your inbox.
          </p>
        </div>
        <Link href="/login" className="block w-full min-w-0">
          <Button variant="outline" className="w-full h-12 rounded-3xl font-bold text-xs tracking-widest border-border/60 gap-2 transition-all active:scale-[0.98]">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2 text-center min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground font-medium leading-relaxed">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 min-w-0">
        <Input
          label="Email address"
          placeholder="name@example.com"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          disabled={isLoading}
          className="h-12 rounded-3xl bg-muted/20 border-border/60 focus:bg-background"
        />

        <Button
          className="w-full h-12 text-sm font-bold rounded-3xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all border-0 gap-2"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Reset Link
        </Button>
      </form>

      <div className="text-center min-w-0">
        <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}