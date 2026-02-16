'use client';

import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Loader2, X, Clock } from 'lucide-react';
import { Button } from '../ui/button';
import { ApiService } from '../../services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { cn } from '../../lib/utils/cn';

interface VerificationBannerProps {
    user: {
        email: string;
        emailVerified: boolean;
        accountType: 'INDIVIDUAL' | 'ORGANIZER';
        organization?: {
            status: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
        } | null;
    };
}

export function VerificationBanner({ user }: VerificationBannerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const handleResendEmail = async () => {
        setIsLoading(true);
        try {
            await ApiService.auth.resendVerification(user.email);
            toast.success("Verification link sent to your inbox");
        } catch (error) {
            toast.error("Could not send the link. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isDismissed) return null;

    const needsEmail = !user.emailVerified;
    const orgStatus = user.organization?.status || 'NOT_SUBMITTED';
    const isOrgVerified = orgStatus === 'VERIFIED';
    const isOrgPending = orgStatus === 'PENDING';
    const needsOrgSubmission =
        user.accountType === 'ORGANIZER' &&
        !isOrgVerified &&
        !isOrgPending;

    if (!needsEmail && isOrgVerified && user.accountType === 'ORGANIZER') return null;
    if (!needsEmail && user.accountType === 'INDIVIDUAL') return null;

    let title = 'Verify your email address';
    let description =
        'Check your inbox for a confirmation link to secure your account';
    let buttonText = 'Verify';
    let linkTab = 'profile';
    let Icon = ShieldAlert;

    if (needsEmail && (needsOrgSubmission || isOrgPending)) {
        title = 'Setup incomplete';
        description =
            'Confirm your email to continue with organization setup';
    } else if (!needsEmail && needsOrgSubmission) {
        title = 'Setup organization';
        description =
            'Upload entity details to start raising impact capital';
        buttonText = 'Configure';
        linkTab = 'org';
    } else if (!needsEmail && isOrgPending) {
        title = 'Review in progress';
        description =
            "We're checking your documents. We'll notify you shortly";
        buttonText = 'Status';
        linkTab = 'org';
        Icon = Clock;
    }

    return (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 animate-in slide-in-from-top duration-500 z-40 relative">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">

                {/* Left Section: Content Identity */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                        <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-amber-900 leading-none mb-1">
                            {title}
                        </p>
                        <p className="text-xs text-amber-800/80 font-medium leading-tight line-clamp-1 sm:line-clamp-none">
                            {description}
                        </p>
                    </div>
                </div>

                {/* Right Section: Compact Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-2">
                        {needsEmail && (
                            <button
                                onClick={handleResendEmail}
                                disabled={isLoading}
                                className="h-8 px-3 rounded-3xl text-[11px] font-bold text-amber-700 hover:bg-amber-500/10 transition-colors disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                            >
                                {isLoading && <Loader2 className="h-3 w-3 animate-spin mr-1.5" />}
                                Resend
                            </button>
                        )}

                        <Link
                            href={`/dashboard/settings?tab=${linkTab}`}
                            scroll={false}
                            className="shrink-0"
                        >
                            <Button
                                size="sm"
                                className="h-8 rounded-3xl text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white border-0 px-4 shadow-sm active:scale-95 transition-all gap-1.5"
                            >
                                {buttonText}
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>

                        <div className="w-px h-4 bg-amber-500/20 mx-1 hidden sm:block" />

                        <button
                            onClick={() => setIsDismissed(true)}
                            className="p-1.5 hover:bg-amber-500/10 rounded-full text-amber-700/50 transition-colors shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}