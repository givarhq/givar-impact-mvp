'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Caveat } from 'next/font/google';
import { ShieldCheck, Users, FileText, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardContent } from '../../../../components/ui/card';
import { ApiService } from '../../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils/cn';

const caveat = Caveat({
    subsets: ['latin'],
    weight: ['600', '700'],
});

const partnerSchema = z.object({
    companyName: z.string().min(2, 'Company name is required'),
    name: z.string().min(2, 'Your name is required'),
    role: z.string().min(2, 'Role/title is required'),
    email: z.string().email('A valid work email is required'),
    phone: z.string().optional(),
    areas: z.array(z.string()).min(1, 'Please select at least one area'),
    notes: z.string().optional(),
});

type PartnerFormValues = z.infer<typeof partnerSchema>;

const IMPACT_AREAS = [
    'Medical',
    'Community & essential needs',
    'Education',
    'Other'
];

export function PartnerForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PartnerFormValues>({
        resolver: zodResolver(partnerSchema),
        defaultValues: {
            areas: [],
        },
    });

    const selectedAreas = watch('areas') || [];

    const toggleArea = (area: string) => {
        if (selectedAreas.includes(area)) {
            setValue('areas', selectedAreas.filter(a => a !== area), { shouldValidate: true });
        } else {
            setValue('areas', [...selectedAreas, area], { shouldValidate: true });
        }
    };

    const onSubmit = async (data: PartnerFormValues) => {
        setIsSubmitting(true);
        const toastId = toast.loading('Sending your enquiry...');
        try {
            await ApiService.corporate.submitEnquiry(data);
            toast.success('Enquiry submitted successfully', { id: toastId });
            setIsSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            toast.error('Failed to submit enquiry. Please try again.', { id: toastId });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto w-full min-w-0">
            {/* Header - Shifted up */}
            <div className="text-center space-y-2 mb-6 md:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-[11px] md:text-xs font-bold tracking-widest text-primary uppercase">
                    Partner with Givar
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
                    Let's create real impact together.
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                    Tell us a little about your organisation and we'll be in touch to explore how we can work together.
                </p>
            </div>

            <div className="relative">
                {/* Decorative Annotation with Caveat cursive font and emerald text / brand green heart */}
                <div className="hidden lg:block absolute -right-32 top-1/2 -translate-y-1/2 -rotate-[6deg] z-0 select-none">
                    <p className={`${caveat.className} text-[#064e3b] dark:text-emerald-400 text-2xl font-bold whitespace-nowrap leading-tight`}>
                        A healthier<br />
                        tomorrow<br />
                        is possible.
                    </p>
                    <div className="flex justify-start items-center mt-1 text-primary">
                        <svg width="22" height="18" viewBox="0 0 40 36" fill="none" className="stroke-current stroke-[2.5]">
                            <path d="M20 32C20 32 4 22 4 11C4 5 8.5 2 13.5 2C17 2 19 4 20 6C21 4 23 2 26.5 2C31.5 2 36 5 36 11C36 22 20 32 20 32Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="w-16 h-1 bg-primary rounded-full mt-1.5 -rotate-[2deg]" />
                </div>

                {/* Form Container */}
                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.4 }}
                            className="relative z-10"
                        >
                            <Card className="rounded-[32px] border border-border/40 bg-card shadow-xl overflow-hidden">
                                <CardContent className="p-6 md:p-10">
                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                                        {/* Company Name */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-muted-foreground ml-1">Company name <span className="text-destructive">*</span></label>
                                            <Input
                                                placeholder="e.g. Access Bank"
                                                {...register('companyName')}
                                                error={errors.companyName?.message}
                                                disabled={isSubmitting}
                                                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                                            />
                                        </div>

                                        {/* Contact Identity */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground ml-1">Your name <span className="text-destructive">*</span></label>
                                                <Input
                                                    placeholder="e.g. Folarin Ajayi"
                                                    {...register('name')}
                                                    error={errors.name?.message}
                                                    disabled={isSubmitting}
                                                    className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground ml-1">Your role / title <span className="text-destructive">*</span></label>
                                                <Input
                                                    placeholder="e.g. CSR Manager"
                                                    {...register('role')}
                                                    error={errors.role?.message}
                                                    disabled={isSubmitting}
                                                    className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                                                />
                                            </div>
                                        </div>

                                        {/* Contact Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground ml-1">Work email <span className="text-destructive">*</span></label>
                                                <Input
                                                    type="email"
                                                    placeholder="e.g. name@company.com"
                                                    {...register('email')}
                                                    error={errors.email?.message}
                                                    disabled={isSubmitting}
                                                    className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-muted-foreground ml-1">Phone number (optional)</label>
                                                <Input
                                                    placeholder="e.g. 0803 123 4567"
                                                    {...register('phone')}
                                                    error={errors.phone?.message}
                                                    disabled={isSubmitting}
                                                    className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                                                />
                                            </div>
                                        </div>

                                        {/* Impact Areas (Checkboxes) */}
                                        <div className="space-y-3 pt-2">
                                            <label className="text-xs font-bold text-muted-foreground ml-1">
                                                What areas are you interested in supporting? <span className="text-destructive">*</span>
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {IMPACT_AREAS.map((area) => {
                                                    const isChecked = selectedAreas.includes(area);
                                                    return (
                                                        <label
                                                            key={area}
                                                            onClick={() => toggleArea(area)}
                                                            className={cn(
                                                                "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98]",
                                                                isChecked
                                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                                    : "border-border/60 bg-muted/10 hover:bg-muted/30"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-all",
                                                                isChecked ? "bg-primary border-primary text-white" : "border-border/60 bg-card"
                                                            )}>
                                                                {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                                                            </div>
                                                            <span className={cn(
                                                                "text-sm font-medium leading-tight",
                                                                isChecked ? "text-primary font-bold" : "text-foreground"
                                                            )}>
                                                                {area}
                                                            </span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                            {errors.areas && <p className="text-xs font-bold text-destructive px-1 animate-in slide-in-from-top-1">{errors.areas.message}</p>}
                                        </div>

                                        {/* Additional Notes */}
                                        <div className="space-y-1.5 pt-2">
                                            <label className="text-xs font-bold text-muted-foreground ml-1">Anything you'd like us to know? (optional)</label>
                                            <Textarea
                                                placeholder="e.g. specific focus areas, upcoming initiatives, etc."
                                                {...register('notes')}
                                                error={errors.notes?.message}
                                                disabled={isSubmitting}
                                                className="min-h-[100px] rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
                                            />
                                        </div>

                                        {/* Submit Button & Disclaimer */}
                                        <div className="pt-4 space-y-4">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full h-14 rounded-3xl font-bold text-base shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90 border-0 transition-all active:scale-[0.98]"
                                            >
                                                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Submit enquiry <ArrowRight className="ml-2 h-5 w-5" /></>}
                                            </Button>
                                            <p className="text-[11px] text-muted-foreground font-medium text-center px-4 leading-relaxed">
                                                By submitting this form, you agree to be contacted by the Givar team about potential partnership opportunities.
                                            </p>
                                        </div>

                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10"
                        >
                            <Card className="rounded-[32px] border-primary/20 bg-primary/5 shadow-xl overflow-hidden text-center p-8 md:p-14">
                                <div className="h-20 w-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-primary/20">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-4">
                                    Thank you for your interest in partnering with Givar.
                                </h2>
                                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto">
                                    Our team will be in touch to learn more about your organisation's CSR goals and how Givar can help turn them into verified impact.
                                </p>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 md:pt-16 pb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                    <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-sm mb-0.5">Verified causes</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">Support genuine needs with confidence.</p>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                    <div className="h-11 w-11 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-inner border border-blue-500/20">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-sm mb-0.5">Real impact</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">Funds go directly to trusted providers.</p>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                    <div className="h-11 w-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner border border-amber-500/20">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground text-sm mb-0.5">Transparent outcomes</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">We document the difference your support makes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}