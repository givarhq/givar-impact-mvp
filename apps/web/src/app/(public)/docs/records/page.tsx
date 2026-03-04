import { PublicLayout } from '../../../../components/layout/public-layout';
import { CheckCircle2, Search, ArrowRight, ShieldCheck, Camera, FileText } from 'lucide-react';
import { Metadata } from 'next';
import { Card, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Public Records',
    description: 'We show you exactly where every kobo of your donation goes.',
};

export default function PublicRecordsPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 max-w-5xl">
                <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Header */}
                    <div className="text-center space-y-3 pt-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-[0.95]">
                            Public <span className="text-primary italic">Records</span>.
                        </h1>
                        <div className="h-1 w-16 bg-primary/20 mx-auto rounded-full" />
                    </div>

                    {/* Intro */}
                    <section className="space-y-6 text-center md:text-left">
                        <div className="space-y-5 text-foreground font-medium leading-relaxed text-lg md:text-xl">
                            <p>
                                We believe you deserve to know exactly what happens to the money you give. No secrets, no hidden fees.
                            </p>
                            <p className="text-muted-foreground">
                                Givar keeps a clear history of every donation and every payment made to a project. We call these "Public Records" because anyone can look at them at any time.
                            </p>
                        </div>
                    </section>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="rounded-3xl border-border/40 bg-card p-6 md:p-8 space-y-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Records stay forever</h3>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                Once a donation is made, it is written down and cannot be deleted or hidden. This means our history is always honest and complete.
                            </p>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card p-6 md:p-8 space-y-4 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                                    <Camera className="h-5 w-5" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Real proof</h3>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                People running projects must upload photos and receipts to show they are doing the work. You don't have to take their word for it — you can see it yourself.
                            </p>
                        </Card>
                    </div>

                    {/* Accountability section */}
                    <section className="bg-muted/30 border border-border/50 rounded-3xl p-6 md:p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10" />
                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-4">
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">Total <span className="text-primary italic">honesty</span>.</h2>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Our team checks every project milestone. We only release the next bit of money after we've seen proof that the previous work was actually done. This keeps everyone accountable.
                                </p>
                            </div>
                            <div className="shrink-0 p-6 rounded-[32px] bg-card border border-border/40 shadow-sm flex flex-col items-center gap-3">
                                <ShieldCheck className="h-8 w-8 text-primary" />
                                <span className="text-xs font-bold text-foreground">Verified Record</span>
                            </div>
                        </div>
                    </section>

                    {/* Bottom CTA */}
                    <section className="text-center space-y-6 pt-8 border-t border-border/40">
                        <h2 className="text-2xl font-bold text-foreground">Want to see a record?</h2>
                        <div className="flex justify-center">
                            <Link href="/explore">
                                <Button size="lg" className="h-12 px-10 rounded-full font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-transform border-0">
                                    Browse active causes <Search className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </section>
                </div>
            </div>
        </PublicLayout>
    );
}