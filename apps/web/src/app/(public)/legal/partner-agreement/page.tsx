import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Card } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Partner Terms',
    description: 'Expectations and terms for vendors, institutions, and service providers participating in Givar campaigns.',
};

export default function PartnerAgreementPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Partner <span className="text-primary italic">Terms</span>.
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
                                    These Partner Terms outline the expectations for vendors, institutions, and service providers participating in campaigns on Givar.
                                </p>

                                <h2>1. Role Of Givar</h2>
                                <p>Givar is a technology platform that connects donors to verified causes and facilitates direct payments to approved vendors. Givar does not operate as a financial custodian or escrow agent.</p>

                                <h2>2. Phased And Incremental Funding</h2>
                                <p>Campaigns are structured in budget phases. As a Partner, you will receive funds incrementally into your designated account as donors contribute. Execution of services should align with confirmed funds received.</p>

                                <h2>3. Direct Routing</h2>
                                <p>Funds are routed directly to your institution's bank account via authorized payment gateways. No funds are handled by campaign organizers.</p>

                                <h2>4. Partial Funding</h2>
                                <p>If a campaign does not reach its full goal, you are expected to adjust the scope of services provided and not proceed beyond the costs covered by the available funds received.</p>

                                <h2>5. Mandatory Return Of Unused Funds</h2>
                                <p>In the event that a campaign is canceled, cannot proceed as planned, or funds received exceed the final cost of services rendered, you are <strong>legally obligated to return the unused balance</strong> to Givar's corporate account.</p>
                                <p>This allows Givar to trigger appropriate refunds to the original donors via our payment gateway. Failure to return unused capital will result in removal from the platform and potential legal action.</p>

                                <h2>6. Verification and Audit</h2>
                                <p>Partners must provide photographic proof of work, invoices, and execution receipts directly to Givar's audit team upon request. This data is required to verify impact for donors and to unlock subsequent funding phases.</p>

                                <h2>7. Misuse</h2>
                                <p>Any misuse or misrepresentation of funds will result in permanent exclusion from the Givar ecosystem.</p>

                                <h2>8. Contact</h2>
                                <p>For partner-related inquiries, please contact: <strong>partners@givarapp.com</strong></p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}