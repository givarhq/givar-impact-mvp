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
                            Givar is a community of trust. By using our platform, you agree to uphold that trust.
                        </p>
                        <p className="text-muted-foreground font-medium">
                            These terms ensure that both donors and project organizers operate with absolute integrity on our immutable ledger.
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
                                    Donations on Givar are final. Once funds are committed to a project, they cannot be reversed. This ensures projects can execute their plans without disruption.
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
                                    We have zero tolerance for fraud. Creating fake projects, misrepresenting identity, or attempting to exploit the wallet system will result in immediate account termination.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                                        <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Platform responsibility</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Funds are never paid to a project owner's personal bank account. Givar's treasury pays verified vendors directly after auditing visual proof of work.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                                        <Scale className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Disputes & Suspension</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Givar reserves the right to suspend projects, freeze ledgers, or reject proposals if our compliance team detects irregularities or violations of our rules.
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
                                    Effective Date: <strong>March 2026</strong>
                                </p>
                                <p>
                                    These Terms of Service ("Terms") govern your access to and use of the Givar Impact Platform. By creating an account or initiating a donation, you explicitly agree to these rules.
                                </p>

                                <h2>1. Account Types & Verification</h2>
                                <ul>
                                    <li><strong>Individual Accounts:</strong> Designed for personal giving. Individuals must verify their email addresses before funding their wallets or making direct contributions.</li>
                                    <li><strong>Organizer Accounts:</strong> Designed for individuals or corporate entities looking to launch public causes. To launch a project, Organizers must successfully pass our Know Your Customer (KYC) audit by uploading valid government IDs or corporate registration documents.</li>
                                </ul>
                                <p>Givar retains absolute discretion to approve, reject, or revoke Organizer verification status based on our internal risk assessments.</p>

                                <h2>2. Immutable Donations & Finality</h2>
                                <p>
                                    Because Givar operates a transparent, triple-entry ledger system designed to provide immediate capital to critical causes, <strong>all donations are final and non-refundable</strong>. Once you confirm a transaction from your Givar Wallet or via Direct Pay, the capital is permanently locked to the target project's ledger.
                                </p>

                                <h2>3. Overfunding, "Spillover", and Stagnant Dust</h2>
                                <p>To maximize global impact, Givar implements automated capital efficiency protocols:</p>
                                <ul>
                                    <li><strong>Spillover Protocol:</strong> If a donation exceeds the remaining financial goal of a project, the exact required amount is allocated to complete the project. The excess funds (the "spillover") are automatically routed to the Givar Suspense Ledger. From there, Givar Administrators manually reallocate the funds to other active, verified causes.</li>
                                    <li><strong>Dust Sweep Protocol:</strong> If a project is effectively completed but has a minute remaining balance (under ₦100) and has been inactive for over 30 days, Givar Administrators may execute a "Dust Sweep." This permanently aligns the project goal to match the raised amount and closes the project to free up platform resources.</li>
                                </ul>

                                <h2>4. Project Execution & Milestone Proofs</h2>
                                <p>Givar does not hand cash to Project Organizers. To ensure total accountability:</p>
                                <ul>
                                    <li>Organizers must define an Execution Roadmap and Budget Ledger during the proposal phase.</li>
                                    <li>When a project is funded, the Givar Treasury team disburses capital <strong>directly to the verified vendors</strong> listed in the budget.</li>
                                    <li>Organizers are required to upload visual Proof of Progress (photos, documents, and narrative updates) to the platform. Only when Givar Administrators approve this evidence will subsequent funding tranches be released.</li>
                                </ul>

                                <h2>5. Platform Fees & Governance</h2>
                                <p>
                                    To maintain our engineering infrastructure, security audits, and payment gateways, Givar deducts a transparent platform fee from incoming transactions.
                                </p>
                                <ul>
                                    <li>The current base fee percentage is dynamically governed by the platform SuperAdmins (historically capped at 20%, currently defaulting to lower operational margins).</li>
                                    <li>Donors may also opt to include a voluntary tip during checkout to further support the platform.</li>
                                    <li>Once a transaction is processed, the exact fee and tip amount taken at that specific moment is permanently snapshotted in the database to prevent historical financial drift.</li>
                                </ul>

                                <h2>6. Prohibited Conduct</h2>
                                <p>You agree not to engage in any of the following activities. Doing so will result in an immediate account lock and potential legal reporting:</p>
                                <ul>
                                    <li>Creating fraudulent or deceptive project proposals.</li>
                                    <li>Submitting forged or altered KYC documents or Milestone Proofs.</li>
                                    <li>Attempting to collude with vendors for kickbacks or circumventing our direct-payment architecture.</li>
                                    <li>Attempting to manipulate, hack, or reverse-engineer the Givar wallet, payment webhooks, or ledger infrastructure.</li>
                                </ul>

                                <h2>7. Administrative Rights & Platform Changes</h2>
                                <p>
                                    We reserve the right to suspend projects, request modifications to proposals, or remove features at any time without prior notice. Givar Administrators utilize a transparent communication thread to deliver feedback directly to your Organizer dashboard.
                                </p>
                                <p>
                                    <strong>Amendments to Live Projects:</strong> Organizers may request to update a live project's financial goal or roadmap. This requires submitting a mandatory "Amendment Narrative" explaining the change to donors. Givar will automatically broadcast this amendment to all project stakeholders to maintain ledger transparency.
                                </p>

                                <h2>8. Contact & Legal</h2>
                                <p>If you have disputes or questions regarding these Terms, please contact <strong>support@givarapp.com</strong>. These terms are governed by the applicable laws of our operating jurisdiction.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div >
        </PublicLayout >
    );
}