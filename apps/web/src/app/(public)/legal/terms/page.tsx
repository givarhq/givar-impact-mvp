import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Scale, HeartHandshake, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'The rules of engagement for the Givar Impact Platform.',
};

export default function TermsPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Terms of <span className="text-primary italic">Service</span>.
                        </h1>
                        <div className="h-1 w-16 bg-primary/20 mx-auto rounded-full" />
                    </div>

                    {/* Intro */}
                    <section className="text-center max-w-3xl mx-auto space-y-4">
                        <p className="text-lg md:text-xl font-medium text-foreground leading-relaxed">
                            Givar is a community of trust. By using our platform, you agree to uphold that trust.
                        </p>
                        <p className="text-muted-foreground font-medium">
                            These terms ensure that both donors and project organizers operate with integrity.
                        </p>
                    </section>

                    {/* Rules Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
                                        <HeartHandshake className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Finality of giving</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Donations on Givar are final. Once funds are committed to a project and deployed to vendors, they cannot be reversed. This ensures projects can execute their plans without disruption.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shadow-inner shrink-0">
                                        <AlertTriangle className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Prohibited conduct</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    We have zero tolerance for fraud. Creating fake projects, misrepresenting identity, or attempting to exploit the wallet system will result in immediate account termination and legal action.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Platform responsibility</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Givar's team directly launches and manages verified causes, tracking all funds from donation to impact. We also provide this same transparent infrastructure for our trusted partners.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                                        <Scale className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Disputes</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Any disputes regarding project execution are investigated by our audit team. We reserve the right to freeze project wallets if suspicious activity is detected.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Footer Note */}
                    <div className="p-6 rounded-3xl bg-muted/20 border border-dashed border-border/60 text-center">
                        <p className="text-xs text-muted-foreground font-medium">
                            Last updated: March 2026. Questions? Contact <a href="mailto:info@givarapp.com" className="text-primary hover:underline">info@givarapp.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}