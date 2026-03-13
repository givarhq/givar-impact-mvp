import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Card } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Cancellation Policy',
    description: 'Guidelines regarding the withdrawal, pausing, or removal of causes on Givar.',
};

export default function CancellationPolicyPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Cancellation <span className="text-primary italic">Policy</span>.
                        </h1>
                        <div className="h-1 w-16 bg-primary/20 mx-auto rounded-full" />
                    </div>

                    {/* Detailed Legal Terms */}
                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                        <div className="p-8 md:p-12">
                            <div className={cn(
                                "max-w-none text-sm text-foreground/80 leading-relaxed font-medium",
                                "[&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border/40",
                                "[&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3",
                                "[&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:last:mb-0",
                                "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6 [&_ul]:space-y-2 [&_ul]:text-muted-foreground [&_ul_li::marker]:text-primary/50",
                                "[&_strong]:font-bold [&_strong]:text-foreground",
                                "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors"
                            )}>
                                <p>
                                    Version: 1.1<br />
                                    Effective Date: <strong>March 13, 2026</strong>
                                </p>

                                <h2>1. Cause Submission Withdrawal</h2>
                                <p>Organisers may withdraw a cause submission at any time before it has been approved and published on the platform.</p>
                                <p>Once a cause is live and receiving donations, cancellation is subject to administrative review.</p>

                                <h2>2. Platform Right to Pause or Remove Causes</h2>
                                <p>Givar reserves the right to pause, suspend, reject, or remove any cause where there are concerns regarding accuracy of information, beneficiary consent, vendor verification, fraud risk, policy violations, or reputational impact.</p>

                                <h2>3. Impact on Donations</h2>
                                <p>If a cause is paused or removed after receiving donations, Givar may hold funds temporarily while a review is conducted. Depending on the outcome, funds may be:</p>
                                <ul>
                                    <li>Disbursed to the verified vendor</li>
                                    <li>Redirected to another verified cause</li>
                                    <li>Handled in accordance with platform governance protocols</li>
                                </ul>

                                <h2>4. Organiser Responsibilities</h2>
                                <p>Organisers are responsible for providing accurate and complete information. Submitting misleading or unauthorised causes may result in cancellation, account suspension, or legal reporting where applicable.</p>

                                <h2>5. Contact</h2>
                                <p>For cancellation-related requests or queries, please contact: <strong>support@givarapp.com</strong></p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}