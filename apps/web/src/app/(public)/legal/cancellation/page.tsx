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
                                    Effective Date: <strong>April 08, 2026</strong>
                                </p>

                                <h2>1. Cause Withdrawal</h2>
                                <p>Organisers may withdraw their cause submission at any time before it has been approved for the public feed. Once a cause is live and receiving donations, withdrawal is subject to administrative review to ensure the protection of already-received capital.</p>

                                <h2>2. Platform Intervention</h2>
                                <p>Givar reserves the right to pause, suspend, or remove any cause where there are concerns regarding the accuracy of information, beneficiary authorization, vendor verification, or fraud risk. In such cases, Givar will immediately halt all further donations and disbursements.</p>

                                <h2>3. Impact on Received Funds</h2>
                                <p>If a cause is cancelled after funds have been raised, Givar will take steps to ensure the capital is handled in accordance with the donors' original intent. This may include:</p>
                                <ul>
                                    <li><strong>Refunds:</strong> Coordinating with the vendor to return the funds for refunding to donors.</li>
                                    <li><strong>Redirection:</strong> With donor consent, redirecting the funds to another verified cause within the same sector (e.g., from one medical cause to another).</li>
                                    <li><strong>Ledger Adjustment:</strong> Holding the funds in the platform suspense ledger until an audited resolution is achieved.</li>
                                </ul>

                                <h2>4. Organiser Responsibilities</h2>
                                <p>Submitting misleading, unauthorized, or fraudulent causes is a violation of platform policy. Such actions will result in permanent account termination and, where appropriate, reporting to regulatory or legal authorities.</p>

                                <h2>5. Contact</h2>
                                <p>For cancellation-related queries, please contact: <strong>compliance@givarapp.com</strong></p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}