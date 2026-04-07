import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Card } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Partner Agreement',
    description: 'Outlines the phased funding, vendor execution, and financial expectations for Givar impact partners.',
};

export default function PartnerAgreementPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Partner <span className="text-primary italic">Agreement</span>.
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
                                    Effective Date: <strong>Pending Publication</strong>
                                </p>

                                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20 text-primary mt-6 mb-10">
                                    <strong>Notice:</strong> The full legal text of the Givar Partner Agreement is currently undergoing final administrative review. It will be published here shortly.
                                </div>

                                <h2>1. Phased Funding Overview</h2>
                                <p>Givar operates on a strict phased funding model to ensure total financial transparency and accountability for our donors.</p>
                                <ul>
                                    <li>Projects are funded incrementally based on distinct budget items.</li>
                                    <li>Payments will be disbursed to verified vendors in tranches (phases) corresponding to the execution roadmap.</li>
                                    <li>Subsequent funding phases will only unlock after the current phase is completed and visually verified by the platform administration.</li>
                                </ul>

                                <h2>2. Unused Funds and Project Cancellation</h2>
                                <p>In the event that a campaign does not proceed as planned, or a vendor is unable to fulfill the agreed-upon services:</p>
                                <ul>
                                    <li>Vendors are expected to promptly return any unused or unallocated funds to the Givar corporate treasury.</li>
                                    <li>Givar reserves the right to hold these funds in suspense until they can be legally reallocated to an active cause or refunded to the original donors in accordance with our Refund Policy.</li>
                                </ul>

                                <h2>3. Vendor Onboarding</h2>
                                <p>For the time being, all vendor onboarding, verification, and SLA (Service Level Agreement) signing will be handled directly by Givar Management off-platform prior to any treasury disbursements.</p>

                                <h2>4. Contact</h2>
                                <p>For inquiries regarding vendor partnerships and phased disbursements, please contact: <strong>support@givarapp.com</strong></p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}