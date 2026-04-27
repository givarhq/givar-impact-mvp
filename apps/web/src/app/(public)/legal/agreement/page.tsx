import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Card } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Cause Organiser Agreement',
    description: 'Terms and responsibilities for launching and managing a cause on Givar.',
};

export default function AgreementPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Cause Organiser <span className="text-primary italic">Agreement</span>.
                        </h1>
                        <div className="h-1 w-16 bg-primary/20 mx-auto rounded-full" />
                    </div>

                    {/* Detailed Legal Terms */}
                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                        <div className="p-8 md:p-12">
                            <div className={cn(
                                "max-w-none text-sm text-foreground/80 leading-relaxed font-medium",
                                "[&_h2]:font-black [&_h2]:tracking-tight[&_h2]:text-foreground [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border/40",
                                "[&_h3]:font-bold[&_h3]:tracking-tight [&_h3]:text-foreground [&_h3]:text-lg[&_h3]:mt-6 [&_h3]:mb-3",
                                "[&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:last:mb-0",
                                "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6[&_ul]:space-y-2 [&_ul]:text-muted-foreground [&_ul_li::marker]:text-primary/50",
                                "[&_strong]:font-bold [&_strong]:text-foreground",
                                "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors"
                            )}>
                                <p>
                                    Version: 1.2<br />
                                    Effective Date: <strong>March 2026</strong>
                                </p>
                                <p>
                                    By submitting a cause on Givar, you agree to the following terms.
                                </p>

                                <h2>1. Authority and Accuracy</h2>
                                <p>You confirm that all information provided about the cause, beneficiary, and vendors is accurate to the best of your knowledge.</p>
                                <p>You also confirm that you are authorised to submit this cause and represent the beneficiary or their interests where reasonably possible.</p>

                                <h2>2. Beneficiary Awareness</h2>
                                <p>You confirm that the beneficiary or their legal guardian is aware of and has authorised the fundraising effort where reasonably possible given the circumstances.</p>

                                <h2>3. Verification Process</h2>
                                <p>You agree to cooperate with Givar's verification process, including responding to requests for additional information or documentation.</p>
                                <p>Failure to provide requested information may result in delays, rejection, or suspension of the cause.</p>

                                <h2>4. Platform Discretion</h2>
                                <p>Givar reserves the right to approve, reject, pause, or remove causes at its discretion where verification concerns, policy issues, or fraud risks arise.</p>

                                <h2>5. Phased Vendor Disbursements</h2>
                                <p>You understand that funds raised on Givar are <strong>never paid to organisers personally</strong>. Donations are processed via authorized third-party gateways and routed directly to verified vendor accounts. Givar acts solely as the verifiable technology layer ensuring payments only route when milestones are met.</p>
                                <ul>
                                    <li><strong>Phased Funding:</strong> Campaigns are funded in distinct phases according to the approved budget roadmap. Inbound donations will pause automatically when an active phase is fully funded.</li>
                                    <li><strong>Direct Routing:</strong> Givar will authorize the routing of funds directly to verified vendors or service providers for the completion of that specific phase.</li>
                                    <li><strong>Proof of Work:</strong> You are strictly required to upload visual proof of progress (receipts, photos) upon the completion of a phase. Givar will not authorize funding routing for subsequent phases until this proof is audited and approved by our compliance team.</li>
                                </ul>
                                <p>Givar is not responsible for the quality, timing, or outcome of services delivered by vendors once payment has been routed.</p>

                                <h2>6. Updates and Transparency</h2>
                                <p>You agree to provide truthful updates, supporting evidence, and reasonable cooperation to maintain transparency for donors.</p>

                                <h2>7. Misrepresentation</h2>
                                <p>Knowingly submitting false, misleading, or unauthorised causes may result in account suspension and potential legal reporting.</p>

                                <h2>8. Contact</h2>
                                <p>For questions regarding cause submissions, please contact: <strong>support@givarapp.com</strong></p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}