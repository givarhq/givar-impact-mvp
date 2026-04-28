import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Card } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Refund Policy',
    description: 'Information regarding the finality of contributions and exception handling on the Givar platform.',
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
                                    Effective Date: <strong>April 08, 2026</strong>
                                </p>
                                <p>
                                    Givar operates a transparent giving platform where contributions are made to support verified causes.
                                </p>

                                <h2>1. Finality of Contributions</h2>
                                <p>Contributions made on Givar are generally considered final once a transaction is successfully processed. As payments are directed to verified vendors or institutions for specific project phases, Givar cannot guarantee a refund once funds have been settled into the vendor's bank account.</p>

                                <h2>2. Exception Handling and Vendor Coordination</h2>
                                <p>In the event of confirmed fraud, misrepresentation, or if a project cannot proceed as planned, Givar will intervene to protect donor interests. Our ability to issue a refund is dependent on the following:</p>
                                <ul>
                                    <li><strong>Settlement Status:</strong> If the funds have not yet been settled into the vendor's account, Givar may be able to cancel the transaction.</li>
                                    <li><strong>Vendor Return:</strong> If funds have already been settled, Givar will coordinate with the institution to secure the return of the unused capital. A refund can only be triggered to the donor once the vendor has returned the funds to Givar's corporate account.</li>
                                </ul>

                                <h2>3. Payment Processing Errors</h2>
                                <p>If a donor experiences a confirmed duplicate charge or technical payment error, Givar will work with our payment gateway providers to resolve the issue as quickly as possible.</p>

                                <h2>4. Currency Conversion</h2>
                                <p>For international donors, the final amount refunded may vary slightly from the original amount given due to fluctuations in exchange rates or bank processing fees. Givar is not responsible for these discrepancies.</p>

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