'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldCheck, Users, FileText, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { Card, CardContent } from '../../../../components/ui/card';
import { ApiService } from '../../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../../lib/utils/cn';

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
    'Education',
    'Community & essential needs',
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
            {/* Header */}
            <div className="text-center space-y-3 mb-10 md:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <p className="text-[11px] md:text-xs font-bold tracking-widest text-primary uppercase">
                    Partner With Givar
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
                    Let's Create Real Impact Together.
                </h1>
                <p className="text-sm md:text-base text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                    Tell us a little about your organisation and we'll be in touch to explore how we can work together.
                </p>
            </div>

            <div className="relative">
                {/* Decorative Annotation (Visible on Desktop) */}
                <div className="hidden lg:block absolute -right-32 top-1/2 -translate-y-1/2 rotate-[-6deg] z-0">
                    <p className="text-emerald-700 font-serif italic text-xl font-bold whitespace-nowrap">
                        A healthier<br />
                        tomorrow<br />
                        is possible. ♡
                    </p>
                    {/* SVG Brush Underline */}
                    <svg className="absolute -bottom-3 left-0 w-full h-3 text-primary opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 md:pt-24 pb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-500/20">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-1">Verified causes</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">Support genuine needs with confidence.</p>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-inner border border-blue-500/20">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-1">Real impact</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">Funds go directly to trusted providers.</p>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shadow-inner border border-amber-500/20">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-1">Transparent outcomes</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">We document the difference your support makes.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}