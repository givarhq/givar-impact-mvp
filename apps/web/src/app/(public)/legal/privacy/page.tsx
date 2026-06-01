import { DocsLayout } from '../../../../components/layout/docs-layout';
import { Metadata } from 'next';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'How we protect your data while maintaining a transparent public ledger.',
};

export default function PrivacyPage() {
    return (
        <DocsLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2 border-b border-border/40 pb-6">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                        Privacy Policy
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Last updated: 8 April 2026
                    </p>
                </div>

                <div className={cn(
                    "max-w-none text-sm md:text-base text-foreground/80 leading-relaxed font-medium",
                    "[&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border/40 first:[&_h2]:border-none first:[&_h2]:pt-0 first:[&_h2]:mt-0",
                    "[&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:mt-6 [&_h3]:mb-3",
                    "[&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:last:mb-0",
                    "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6 [&_ul]:space-y-2 [&_ul]:text-muted-foreground [&_ul_li::marker]:text-primary/50",
                    "[&_strong]:font-bold [&_strong]:text-foreground",
                    "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors"
                )}>
                    <h2 id="quick-summary">Quick Summary</h2>
                    <p>
                        We are building a transparent world, but that doesn't mean you lose your privacy. Givar distinguishes strictly between <strong>public ledger data</strong> (where funds are used) and <strong>private identity data</strong> (who you are).
                    </p>
                    <ul>
                        <li><strong>What is public?</strong> To prove impact, we display transaction amounts, dates, and project receipts. However, your donor name is masked (e.g., "J*** D.") on public pages to protect your identity.</li>
                        <li><strong>What is private?</strong> Your email address, phone number, password, and verification documents are strictly private. We do not sell your personal contact information.</li>
                        <li><strong>Data retention:</strong> To maintain transparency and accountability, transaction records are retained as part of the platform's audit history. If you delete your account, your personal profile is removed, but your transaction history remains as an anonymized record.</li>
                        <li><strong>Security:</strong> We use industry-standard security measures. Payment processing is handled by compliant third-party providers such as Paystack, meaning your card data does not pass through or remain on our servers.</li>
                    </ul>

                    <h2 id="information-we-collect">1. Information We Collect</h2>
                    <p>We collect information necessary to operate the platform securely and transparently:</p>
                    <ul>
                        <li><strong>Identity data:</strong> Your name, email address, and account credentials.</li>
                        <li><strong>Beneficiary data:</strong> Information and supporting documents related to beneficiaries for verification purposes.</li>
                        <li><strong>Verification (KYC) data:</strong> For organisers, we collect legal and registration information, which is stored securely and accessed only for compliance purposes.</li>
                        <li><strong>Transaction data:</strong> Records of your contributions and activity on the platform.</li>
                        <li><strong>System audit data:</strong> Technical data such as IP address, device information, and timestamps for security and fraud prevention.</li>
                    </ul>

                    <h2 id="how-we-use-your-information">2. How We Use Your Information</h2>
                    <p>We use your information to:</p>
                    <ul>
                        <li><strong>Operate the platform:</strong> Process contributions and maintain accurate records of platform activity.</li>
                        <li><strong>Compliance and security:</strong> Verify identities and prevent fraud.</li>
                        <li><strong>Communication:</strong> Send transactional messages such as confirmations, updates, and alerts.</li>
                    </ul>

                    <h2 id="public-vs-private-information">3. Public Vs Private Information</h2>
                    <p>Givar is built on transparency while protecting personal identity.</p>
                    <ul>
                        <li><strong>Public information:</strong> Project details, funding progress, vendor information, and proof of impact are visible. Transaction amounts and timestamps may also be displayed. Donor identities are masked by default.</li>
                        <li><strong>Private information:</strong> Your personal contact details, account credentials, and verification documents remain confidential and are accessible only to authorized personnel.</li>
                    </ul>

                    <h2 id="data-sharing">4. Data Sharing And Third-Party Services</h2>
                    <p>We do not sell your data. We only share information with trusted providers necessary to operate the platform:</p>
                    <ul>
                        <li><strong>Payment providers (e.g., Paystack):</strong> To process transactions securely.</li>
                        <li><strong>Cloud storage providers:</strong> To store platform data and media.</li>
                        <li><strong>Communication providers:</strong> To deliver system notifications and updates.</li>
                    </ul>

                    <h2 id="data-retention">5. Data Retention And Account Deletion</h2>
                    <p>Transaction records are retained for transparency and audit purposes. If you delete your account:</p>
                    <ul>
                        <li>Your personal profile will be removed.</li>
                        <li>Your transaction history will remain in anonymized form.</li>
                    </ul>
                    <p>Accounts associated with active or completed causes may be retained for audit and accountability purposes.</p>

                    <h2 id="administrative-access">6. Administrative Access</h2>
                    <p>Authorized administrators may access accounts for support and troubleshooting purposes. This access is restricted, monitored, and used only when necessary.</p>

                    <h2 id="contact">7. Contact</h2>
                    <p>If you have any questions about this privacy policy, please contact: <strong>support@givarapp.com</strong></p>
                </div>
            </div>
        </DocsLayout>
    );
}