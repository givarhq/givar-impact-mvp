'use client';

import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Loader2, X, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { ApiService } from '../../services/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

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

    // Logic: Do not aggressively prompt pure donors for KYC. 
    // Only prompt for KYC if they have an active pending/rejected state,
    // OR if they specifically toggled their account to ORGANIZER but haven't submitted.
    const isActivelySeekingKyc = orgStatus === 'PENDING' || orgStatus === 'REJECTED';
    const isOrganizerLackingKyc = user.accountType === 'ORGANIZER' && orgStatus === 'NOT_SUBMITTED';

    const needsKycBanner = isActivelySeekingKyc || isOrganizerLackingKyc;

    // If they don't need email verification and don't fall into the KYC banner criteria, render nothing.
    if (!needsEmail && !needsKycBanner) return null;

    let title = 'Verify your email address';
    let description = 'Please check your inbox for a confirmation link to secure your account.';
    let buttonText = 'Verify email';
    let linkTab = 'profile';
    let Icon = ShieldAlert;
    let colorTheme = 'amber'; // 'amber' | 'rose' | 'blue'

    // Hierarchy of needs: Email > Rejected KYC > Pending KYC > Unsubmitted Organizer KYC
    if (needsEmail) {
        // Defaults apply (Amber)
    } else if (orgStatus === 'REJECTED') {
        title = 'Verification declined';
        description = 'Please review the feedback and resubmit your identity documents.';
        buttonText = 'Review feedback';
        linkTab = 'org';
        colorTheme = 'rose';
    } else if (orgStatus === 'PENDING') {
        title = 'Identity audit in progress';
        description = "We're currently checking your documents. We'll notify you as soon as you're verified.";
        buttonText = 'View status';
        linkTab = 'org';
        Icon = Clock;
        colorTheme = 'blue';
    } else if (isOrganizerLackingKyc) {
        title = 'Verify your identity';
        description = 'Upload your identity documents to start raising funds for your causes.';
        buttonText = 'Complete setup';
        linkTab = 'org';
        Icon = ShieldCheck;
    }

    const themeStyles = {
        amber: {
            bg: "bg-amber-500/10 dark:bg-amber-500/5",
            border: "border-amber-500/20 dark:border-amber-500/10",
            iconBg: "bg-amber-500/20 dark:bg-amber-500/10",
            iconText: "text-amber-600 dark:text-amber-500",
            titleText: "text-amber-900 dark:text-amber-100",
            descText: "text-amber-800/80 dark:text-amber-400/80",
            btnBg: "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600",
            resendText: "text-amber-700 dark:text-amber-500 hover:bg-amber-500/10",
            closeHover: "hover:bg-amber-500/10 text-amber-700/50 dark:text-amber-500/30"
        },
        rose: {
            bg: "bg-rose-500/10 dark:bg-rose-500/5",
            border: "border-rose-500/20 dark:border-rose-500/10",
            iconBg: "bg-rose-500/20 dark:bg-rose-500/10",
            iconText: "text-rose-600 dark:text-rose-500",
            titleText: "text-rose-900 dark:text-rose-100",
            descText: "text-rose-800/80 dark:text-rose-400/80",
            btnBg: "bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
            resendText: "", // Not used in this state
            closeHover: "hover:bg-rose-500/10 text-rose-700/50 dark:text-rose-500/30"
        },
        blue: {
            bg: "bg-blue-500/10 dark:bg-blue-500/5",
            border: "border-blue-500/20 dark:border-blue-500/10",
            iconBg: "bg-blue-500/20 dark:bg-blue-500/10",
            iconText: "text-blue-600 dark:text-blue-500",
            titleText: "text-blue-900 dark:text-blue-100",
            descText: "text-blue-800/80 dark:text-blue-400/80",
            btnBg: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
            resendText: "", // Not used in this state
            closeHover: "hover:bg-blue-500/10 text-blue-700/50 dark:text-blue-500/30"
        }
    }[colorTheme];

    return (
        <div className={`w-full ${themeStyles.bg} border-b ${themeStyles.border} px-4 py-2 sm:py-2.5 animate-in slide-in-from-top duration-500 z-40 transition-colors`}>
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">

                {/* Left Section */}
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl ${themeStyles.iconBg} flex items-center justify-center ${themeStyles.iconText} shrink-0 shadow-inner`}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>

                    <div className="min-w-0 space-y-0 sm:space-y-0.5">
                        <p className={`text-sm font-bold ${themeStyles.titleText} leading-snug`}>
                            {title}
                        </p>
                        <p className={`text-xs ${themeStyles.descText} font-medium leading-snug sm:truncate`}>
                            {description}
                        </p>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-between sm:justify-end">

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {needsEmail && (
                            <button
                                onClick={handleResendEmail}
                                disabled={isLoading}
                                className={`h-8 sm:h-8 px-4 rounded-3xl text-xs font-bold ${themeStyles.resendText} transition-colors disabled:opacity-50 w-full sm:w-auto flex items-center justify-center`}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                ) : null}
                                Resend email
                            </button>
                        )}

                        <Link
                            href={`/dashboard/settings?tab=${linkTab}`}
                            className="w-full sm:w-auto"
                        >
                            <Button
                                size="sm"
                                className={`h-8 sm:h-8 w-full sm:w-auto rounded-3xl text-xs font-bold ${themeStyles.btnBg} text-white border-0 px-5 shadow-sm active:scale-95 transition-all`}
                            >
                                {buttonText}
                                <ArrowRight className="ml-1.5 h-3 w-3" />
                            </Button>
                        </Link>
                    </div>

                    <button
                        onClick={() => setIsDismissed(true)}
                        className={`p-1 rounded-full ${themeStyles.closeHover} transition-colors`}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}