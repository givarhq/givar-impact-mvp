import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Scale, HeartHandshake, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'The rules of engagement for the Givar Impact Platform.',
};

export default function TermsPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Terms of <span className="text-primary italic">Service</span>.
                        </h1>
                        <div className="h-1 w-16 bg-primary/20 mx-auto rounded-full" />
                    </div>

                    {/* Intro */}
                    <section className="text-center max-w-3xl mx-auto space-y-4">
                        <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                            Givar is a platform built on trust and transparency. By using the platform, you agree to operate in good faith and in accordance with these terms.
                        </p>
                    </section>

                    {/* Quick Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
                                        <HeartHandshake className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Finality of giving</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Contributions made on Givar are generally final once a transaction is successfully processed.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-inner shrink-0">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Prohibited conduct</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Submitting false information, engaging in fraud, or attempting to exploit the platform will result in account suspension or removal.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Vendor payments</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Payments are made through third-party payment providers and directed to verified vendors or institutions supporting the cause. Givar does not store or control funds after payment has been completed.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                                        <Scale className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Review & intervention</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Givar may review campaign activity in cases of suspected fraud, misrepresentation, technical issues, or policy violations.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Legal Terms */}
                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                        <div className="p-8 md:p-12">
                            <div className={cn(
                                "max-w-none text-sm text-foreground/80 leading-relaxed font-medium",
                                "[&_h2]:font-black[&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:text-2xl[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border/40",
                                "[&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-foreground[&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3",
                                "[&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:last:mb-0",
                                "[&_ul]:list-disc [&_ul]:pl-5[&_ul]:mb-6 [&_ul]:space-y-2 [&_ul]:text-muted-foreground[&_ul_li::marker]:text-primary/50",
                                "[&_strong]:font-bold [&_strong]:text-foreground",
                                "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors"
                            )}>
                                <p>
                                    Version: 1.1<br />
                                    Effective Date: <strong>April 08, 2026</strong>
                                </p>

                                <h2>1. Platform Overview</h2>
                                <p>Givar is a digital platform that connects donors to verified social impact causes and facilitates payments to approved vendors or institutions.</p>
                                <p>Givar does not operate as a financial custodian of funds and does not guarantee the success or full funding of any campaign.</p>

                                <h2>2. Accounts And Verification</h2>
                                <p>Users may create accounts to support causes or submit campaigns.</p>
                                <p>Organisers may be required to complete identity verification and provide supporting documentation before a cause is approved.</p>
                                <p>Givar reserves the right to approve, reject, or revoke account access at its discretion.</p>

                                <h2>3. Contributions And Finality</h2>
                                <p>Contributions made on Givar are generally final once a transaction is successfully processed.</p>
                                <p>Payments are made through third-party payment providers and directed to verified vendors or institutions supporting the cause.</p>
                                <p>Givar does not store or control funds after payment has been completed.</p>

                                <h2>4. Campaign Structure</h2>
                                <p>Campaigns may be structured in stages or budget components.</p>
                                <p>Only specific portions of a campaign may be open for funding at a given time. Progression may depend on verification of prior stages.</p>
                                <p>This structure is intended to improve transparency and manage risk and does not imply that funds are held or released by Givar.</p>

                                <h2>5. Vendors & Service Delivery</h2>
                                <p>Payments are made directly to verified vendors. Givar is not responsible for the quality, timing, or outcome of services delivered by these third parties. Vendors are subject to a separate Partner Agreement requiring the return of unused funds if a project fails.</p>

                                <h2>6. Platform Review & Intervention</h2>
                                <p>Givar may review campaign activity in cases of suspected fraud, misrepresentation, technical issues, or policy violations.</p>
                                <p>Where necessary, Givar may coordinate with payment providers, vendors, or relevant parties to determine an appropriate outcome.</p>

                                <h2>7. Prohibited Conduct</h2>
                                <p>You agree not to:</p>
                                <ul>
                                    <li>Submit false or misleading information</li>
                                    <li>Engage in fraudulent activity</li>
                                    <li>Attempt to exploit or manipulate the platform</li>
                                    <li>Use the platform for prohibited or unlawful purposes</li>
                                </ul>
                                <p>Violations may result in account suspension or removal.</p>

                                <h2>8. Platform Fees</h2>
                                <p>Givar may apply a transparent platform fee to transactions to support infrastructure, operations, and payment processing.</p>
                                <p>Optional contributions to support the platform may also be provided by users.</p>

                                <h2>9. Limitation Of Liability</h2>
                                <p>Givar provides a platform to facilitate transparent giving but does not assume liability for:</p>
                                <ul>
                                    <li>Vendor performance</li>
                                    <li>Campaign outcomes</li>
                                    <li>Funding shortfalls</li>
                                </ul>

                                <h2>10. Modifications</h2>
                                <p>Givar may update these terms from time to time. Continued use of the platform constitutes acceptance of any updates.</p>

                                <h2>11. Contact</h2>
                                <p>For questions regarding these terms, please contact: <strong>support@givarapp.com</strong></p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}