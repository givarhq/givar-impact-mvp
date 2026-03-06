import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { Shield, Eye, Lock, Database } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui/card';
import { cn } from '../../../../lib/utils/cn';

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
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground leading-[0.95]">
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
                            Givar distinguishes strictly between <strong>Public Ledger Data</strong> (where the money goes) and <strong>Private Identity Data</strong> (who you are).
                        </p>
                    </section>

                    {/* Quick Summary Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner shrink-0">
                                        <Eye className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">What is public?</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    To prove impact, we show transaction amounts, dates, and project receipts. However, your donor name is masked (e.g., "J*** D.") on public pages to protect your identity.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shadow-inner shrink-0">
                                        <Lock className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">What is private?</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Your email address, phone number, password, and KYC documents are strictly private. We never sell your personal contact information to advertisers.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                                        <Database className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Data retention</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Because we operate an immutable ledger, financial records cannot be deleted. If you delete your account, your personal profile is removed, but the transaction history remains as an anonymous entry.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40 bg-card shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 shadow-inner shrink-0">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground">Security first</h3>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    We use industry-standard encryption. Payment processing is handled by compliant gateways (Paystack), meaning your card data never touches or rests on our servers.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Legal Policy */}
                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                        <div className="p-8 md:p-12">
                            <div className={cn(
                                "max-w-none text-sm text-foreground/80 leading-relaxed font-medium",
                                "[&_h2]:font-black [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border/40",
                                "[&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-foreground[&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3",
                                "[&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:last:mb-0",
                                "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6[&_ul]:space-y-2 [&_ul]:text-muted-foreground [&_ul_li::marker]:text-primary/50",
                                "[&_strong]:font-bold [&_strong]:text-foreground",
                                "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors"
                            )}>
                                <p>
                                    Effective Date: <strong>March 2026</strong>
                                </p>
                                <p>
                                    Givar Impact ("Givar," "we," "us," or "our") operates a transparent, ledger-based platform connecting donors with verified community causes. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services.
                                </p>

                                <h2>1. Information We Collect</h2>
                                <p>We collect information necessary to operate our platform securely and transparently. This includes:</p>
                                <ul>
                                    <li><strong>Identity Data:</strong> Your first name, last name, email address, and account password.</li>
                                    <li><strong>Verification (KYC) Data:</strong> If you register as an Organizer, we collect legal names, registration numbers (e.g., RC or TIN), and government/corporate documents. These are stored in encrypted, private data vaults.</li>
                                    <li><strong>Financial Ledger Data:</strong> Records of your donations, wallet balances, and funding history. We track the movement of capital in our system. <strong>We do not collect or store your credit card numbers.</strong> All direct payment processing is securely handled by Paystack.</li>
                                    <li><strong>System Audit Data:</strong> To prevent fraud, our Watchtower system automatically logs your IP address, User-Agent (browser details), and timestamps when you take critical actions (e.g., logging in, initiating a transfer, or changing a password).</li>
                                </ul>

                                <h2>2. How We Use Your Information</h2>
                                <p>We use the data we collect strictly to provide and improve the Givar platform:</p>
                                <ul>
                                    <li><strong>To Operate the Ledger:</strong> Processing your donations, maintaining your wallet balance, and issuing immutable impact receipts.</li>
                                    <li><strong>For Compliance & Security:</strong> Verifying the legal identity of project organizers to prevent fraud. Our administrative team reviews your KYC documents before you can launch public causes.</li>
                                    <li><strong>To Communicate:</strong> Sending you transactional emails such as security alerts, password resets, donation receipts, and milestone updates about the projects you support.</li>
                                </ul>

                                <h2>3. Public vs. Private Information</h2>
                                <p>Givar is built on the principle of transparency. However, we carefully balance public accountability with personal privacy.</p>
                                <ul>
                                    <li><strong>Public Information:</strong> Project details, funding goals, execution timelines, vendor names for disbursements, and visual proof-of-work are always public. The <em>fact</em> that a donation occurred, its amount, and its timestamp are public. To protect donors, your name is automatically masked (e.g., "M*** T.") on the public ledger unless you are a verified Organizer.</li>
                                    <li><strong>Private Information:</strong> Your exact email address, encrypted account passwords, detailed KYC documents, and granular audit logs are kept strictly confidential and are only accessible by our administrative compliance team.</li>
                                </ul>

                                <h2>4. Data Sharing and Third-Party Services</h2>
                                <p>We do not sell your data. We share information only with trusted infrastructure partners necessary to operate the platform:</p>
                                <ul>
                                    <li><strong>Payment Gateways (Paystack):</strong> To process your wallet funding and direct donations securely.</li>
                                    <li><strong>Cloud Storage (iDrive e2 / Cloudinary):</strong> To store project gallery images publicly, and to store your sensitive KYC documents in heavily restricted, private encrypted buckets accessed only via short-lived security tokens.</li>
                                    <li><strong>Communication Providers (Resend):</strong> To securely deliver system emails and receipts to your inbox.</li>
                                </ul>

                                <h2>5. Data Retention and Account Deletion</h2>
                                <p>Because Givar operates a triple-entry accounting system designed to be an immutable public record, <strong>financial transactions cannot be deleted</strong>. If you choose to delete your account via the Danger Zone in your settings:</p>
                                <ul>
                                    <li>Your personal profile (name, email, password, active sessions) will be permanently destroyed.</li>
                                    <li>Any unallocated wallet balances must be withdrawn or donated prior to deletion.</li>
                                    <li>Your historical donation records will remain on the public ledger permanently, but will be entirely anonymized and disconnected from your identity.</li>
                                </ul>
                                <p>Note: Accounts that have actively launched projects cannot be deleted to ensure we maintain a permanent, auditable record for our donors. Such accounts can only be suspended.</p>

                                <h2>6. Administrative Support Access</h2>
                                <p>If you require technical support, authorized Givar Administrators have the ability to initiate a "Forensic Proxy Session." This allows them to view your account exactly as you see it to troubleshoot issues. <strong>This access is strictly read-only.</strong> Administrators cannot mutate your data, spend your funds, or change your settings while in this mode, and all such sessions are logged in the platform's permanent audit trail.</p>

                                <h2>7. Contact Us</h2>
                                <p>If you have any questions about this Privacy Policy or how we handle your data, please contact our compliance team at <strong>support@givarapp.com</strong>.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}