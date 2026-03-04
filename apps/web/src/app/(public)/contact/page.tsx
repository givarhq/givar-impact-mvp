import { PublicLayout } from '../../../components/layout/public-layout';
import { Mail, MessageCircle, ShieldCheck, MapPin } from 'lucide-react';
import { Metadata } from 'next';
import { Card, CardContent } from '../../../components/ui/card';

export const metadata: Metadata = {
    title: 'Contact Us | Givar',
    description: 'Get in touch with the Givar Impact team for support or inquiries.',
};

export default function ContactPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-12 md:py-24 max-w-4xl">
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                            Get in <span className="text-primary italic">Touch.</span>
                        </h1>
                        <p className="text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
                            Have questions about a cause or need technical assistance? Our support team is here to help you move impact forward.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-8 space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-foreground">Email Support</h3>
                                    <p className="text-sm text-muted-foreground font-medium">For general inquiries and verification help.</p>
                                </div>
                                <a href="mailto:info@givarapp.com" className="text-primary font-black tracking-tight text-xl hover:underline">
                                    info@givarapp.com
                                </a>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card hover:border-primary/30 transition-all shadow-sm">
                            <CardContent className="p-8 space-y-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner">
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-foreground">Technical Ops</h3>
                                    <p className="text-sm text-muted-foreground font-medium">For ledger reconciliation or security issues.</p>
                                </div>
                                <p className="text-foreground font-bold text-sm bg-muted/50 px-3 py-1 rounded-full w-fit">
                                    Response time: &lt; 24h
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="p-8 rounded-3xl bg-muted/20 border border-dashed border-border/60 text-center">
                        <p className="text-xs text-muted-foreground font-medium">
                            Givar Impact Platform • Lagos, Nigeria
                        </p>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}