import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { PartnerForm } from './partner-form';

export const metadata: Metadata = {
    title: 'Partner With Givar',
    description: 'Tell us a little about your organisation and explore how we can work together.',
};

export default function PartnerWithGivarPage() {
    return (
        <PublicLayout>
            <div className="w-full min-w-0 overflow-hidden bg-[#fafafa] dark:bg-background relative">

                {/* STATIC SUBTLE DECORATIVE ELEMENTS (Inspired by Auth page, non-animated) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                    {/* Large Soft Green Glow - Top Left */}
                    <div className="absolute -top-32 -left-36 w-[560px] h-[560px] bg-gradient-to-br from-primary/12 via-primary/5 to-transparent rounded-[140px] blur-[100px]" />

                    {/* Angled Glass Panel - Middle Left */}
                    <div className="hidden lg:block absolute top-[28%] -left-10 w-60 h-[340px] -rotate-[14deg] bg-primary/[0.03] dark:bg-primary/[0.02] border border-primary/10 rounded-[44px] shadow-sm" />

                    {/* Rotated Soft Square - Upper Right */}
                    <div className="hidden md:block absolute top-[14%] right-[7%] w-48 h-48 rotate-[16deg] bg-primary/[0.03] dark:bg-primary/[0.02] border border-primary/10 rounded-[36px]" />

                    {/* Soft Pill Shape - Lower Left */}
                    <div className="hidden sm:block absolute bottom-[16%] left-[12%] -rotate-[10deg] w-48 h-24 bg-primary/[0.035] dark:bg-primary/[0.02] border border-primary/10 rounded-full" />

                    {/* Soft Blurred Circle - Bottom Right */}
                    <div className="absolute -bottom-28 -right-28 w-[500px] h-[500px] bg-gradient-to-tl from-primary/10 via-primary/5 to-transparent rounded-full blur-[90px]" />
                </div>

                <div className="container mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-20 relative z-10">
                    <PartnerForm />
                </div>
            </div>
        </PublicLayout>
    );
}