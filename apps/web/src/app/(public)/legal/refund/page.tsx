import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Card } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Refund Policy',
    description: 'Information regarding the finality of donations and exception handling on the Givar platform.',
};

export default function RefundPolicyPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Refund <span className="text-primary italic">Policy</span>.
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
                                <p>
                                    Givar operates a transparent giving platform where funds are committed to verified causes and paid directly to approved vendors.
                                </p>

                                <h2>1. Finality of Donations</h2>
                                <p>All donations made on Givar are considered final once a transaction is successfully completed.</p>
                                <p>Because funds are committed to specific causes and may be scheduled for vendor disbursement, donations cannot be reversed or refunded at the request of the donor.</p>

                                <h2>2. Platform or Compliance Intervention</h2>
                                <p>In rare circumstances, Givar may review or intervene in a transaction where there are concerns related to fraud, misrepresentation, technical error, or legal compliance.</p>
                                <p>Where appropriate, Givar may determine a suitable resolution which may include holding funds temporarily, reallocating funds to another verified cause, or other corrective action.</p>

                                <h2>3. Payment Processing Errors</h2>
                                <p>If a donor experiences a confirmed duplicate charge or payment processing error, Givar will investigate and work with the payment provider to resolve the issue.</p>

                                <h2>4. Currency Conversion and Bank Fees</h2>
                                <p>For international payments, the final amount charged may vary due to exchange rate fluctuations or bank fees. Givar is not responsible for discrepancies between estimated and final settlement amounts.</p>

                                <h2>5. Contact</h2>
                                <p>For refund-related inquiries, please contact: <strong>support@givarapp.com</strong></p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}