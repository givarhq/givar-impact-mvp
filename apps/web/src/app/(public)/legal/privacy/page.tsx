import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Shield, Eye, Lock, Database } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'How we protect your data while maintaining a transparent public ledger.',
};

export default function PrivacyPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Your <span className="text-primary italic">Privacy</span>.
                        </h1>
                        <div className="h-1 w-16 bg-primary/20 mx-auto rounded-full" />
                    </div>

                    {/* Core Statement */}
                    <section className="text-center max-w-3xl mx-auto space-y-4">
                        <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                            We are building a transparent world, but that doesn't mean you lose your privacy.
                        </p>
                        <p className="text-muted-foreground font-medium">
                            Givar distinguishes between <strong>Public Ledger Data</strong> (where money goes) and <strong>Private Identity Data</strong> (who you are).
                        </p>
                    </section>

                    {/* Policy Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                                        <Eye className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">What is public?</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    To prove impact, we show transaction amounts, dates, and project receipts. However, your name is masked (e.g., "J*** D.") on public pages unless you explicitly choose to be visible.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">What is private?</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Your email address, phone number, password, and payment card details are strictly private. We never sell your personal contact information to advertisers.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Data retention</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Because we operate an immutable ledger, financial records cannot be deleted. If you delete your account, your personal profile is removed, but the donation history remains as an anonymous entry.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-inner shrink-0">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Security first</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    We use industry-standard encryption for all data in transit and at rest. Payment processing is handled by compliant gateways (Paystack), so your card data never touches our servers.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Footer Note */}
                    <div className="p-6 rounded-3xl bg-muted/20 border border-dashed border-border/60 text-center">
                        <p className="text-xs text-muted-foreground font-medium">
                            Last updated: March 2026. For privacy concerns, contact <a href="mailto:support@givarapp.com" className="text-primary hover:underline">support@givarapp.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}