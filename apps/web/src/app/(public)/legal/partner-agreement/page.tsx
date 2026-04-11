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
                                    Version: 1.0<br />
                                    Effective Date: <strong>April 08, 2026</strong>
                                </p>
                                <p>
                                    These Partner Terms outline the expectations for vendors, institutions, and service providers participating in campaigns on Givar.
                                </p>

                                <h2>1. Role Of Givar</h2>
                                <p>Givar is a digital platform that connects donors to verified causes and facilitates payments to approved vendors.</p>
                                <p>Givar does not hold funds on behalf of users and does not guarantee full campaign funding.</p>

                                <h2>2. Phased And Incremental Funding</h2>
                                <p>Campaigns may be structured in phases, and payments may be received incrementally over time. Partners should align service delivery with confirmed funding received.</p>

                                <h2>3. Use Of Funds</h2>
                                <p>All funds must be used strictly for the stated purpose of the campaign and handled transparently.</p>

                                <h2>4. Partial Funding</h2>
                                <p>If a campaign does not reach its full goal, partners are expected to adjust the scope of services accordingly and not proceed beyond what available funds reasonably cover.</p>

                                <h2>5. Partial Execution And Reconciliation</h2>
                                <p>Where services have been partially rendered, partners may retain only the portion of funds that corresponds to the value of services actually delivered.</p>
                                <p>Any remaining balance must be returned so it can be handled in line with Givar's policies.</p>

                                <h2>6. Refund Of Unused Funds</h2>
                                <p>If a campaign cannot proceed as planned or funds exceed what is required, partners are expected to return any unused funds so they can be appropriately handled in line with Givar's policies.</p>

                                <h2>7. Verification And Updates</h2>
                                <p>Partners may be required to provide updates, receipts, or proof of service to support transparency.</p>

                                <h2>8. Misuse</h2>
                                <p>Any misuse or misrepresentation of funds may result in removal from the platform and further action where necessary.</p>
                                <p>By participating in a Givar-supported campaign, partners acknowledge and agree to these terms.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}