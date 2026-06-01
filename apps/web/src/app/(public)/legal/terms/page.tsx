import { DocsLayout } from '../../../../components/layout/docs-layout';
import { Metadata } from 'next';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description: 'The rules of engagement for the Givar Platform.',
};

export default function TermsPage() {
    return (
        <DocsLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2 border-b border-border/40 pb-6">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                        Terms of Service
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Last updated: 8 April 2026
                    </p>
                </div>

                <div className={cn(
                    "max-w-none text-sm text-foreground leading-loose font-medium",
                    "[&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border/40 first:[&_h2]:border-none first:[&_h2]:pt-0 first:[&_h2]:mt-0",
                    "[&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-3",
                    "[&_p]:text-foreground [&_p]:mb-6 [&_p]:last:mb-0",
                    "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6 [&_ul]:space-y-3 [&_ul]:text-foreground [&_ul_li::marker]:text-primary/50",
                    "[&_strong]:font-bold [&_strong]:text-foreground",
                    "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors"
                )}>
                    <h2 id="quick-summary">Quick Summary</h2>
                    <p>
                        Givar is a platform built on trust and transparency. By using the platform, you agree to operate in good faith and in accordance with these terms.
                    </p>
                    <ul>
                        <li><strong>Finality of giving:</strong> Contributions made on Givar are generally final once a transaction is successfully processed.</li>
                        <li><strong>Prohibited conduct:</strong> Submitting false information, engaging in fraud, or attempting to exploit the platform will result in account suspension or removal.</li>
                        <li><strong>Vendor payments:</strong> Payments are made through third-party payment providers and directed to verified vendors or institutions supporting the cause. Givar does not store or control funds after payment has been completed.</li>
                        <li><strong>Review & intervention:</strong> Givar may review campaign activity in cases of suspected fraud, misrepresentation, technical issues, or policy violations.</li>
                    </ul>

                    <h2 id="platform-overview">1. Platform Overview</h2>
                    <p>Givar is a digital platform that connects donors to verified social impact causes and facilitates payments to approved vendors or institutions.</p>
                    <p>Givar does not operate as a financial custodian of funds and does not guarantee the success or full funding of any campaign.</p>

                    <h2 id="accounts-and-verification">2. Accounts And Verification</h2>
                    <p>Users may create accounts to support causes or submit campaigns.</p>
                    <p>Organisers may be required to complete identity verification and provide supporting documentation before a cause is approved.</p>
                    <p>Givar reserves the right to approve, reject, or revoke account access at its discretion.</p>

                    <h2 id="contributions-and-finality">3. Contributions And Finality</h2>
                    <p>Contributions made on Givar are generally final once a transaction is successfully processed.</p>
                    <p>Payments are made through third-party payment providers and directed to verified vendors or institutions supporting the cause.</p>
                    <p>Givar does not store or control funds after payment has been completed.</p>

                    <h2 id="campaign-structure">4. Campaign Structure</h2>
                    <p>Campaigns may be structured in stages or budget components.</p>
                    <p>Only specific portions of a campaign may be open for funding at a given time. Progression may depend on verification of prior stages.</p>
                    <p>This structure is intended to improve transparency and manage risk and does not imply that funds are held or released by Givar.</p>

                    <h2 id="vendors-and-service-delivery">5. Vendors & Service Delivery</h2>
                    <p>Payments are made directly to verified vendors. Givar is not responsible for the quality, timing, or outcome of services delivered by these third parties. Vendors are subject to a separate Partner Agreement requiring the return of unused funds if a project fails.</p>

                    <h2 id="platform-review-intervention">6. Platform Review & Intervention</h2>
                    <p>Givar may review campaign activity in cases of suspected fraud, misrepresentation, technical issues, or policy violations.</p>
                    <p>Where necessary, Givar may coordinate with payment providers, vendors, or relevant parties to determine an appropriate outcome.</p>

                    <h2 id="prohibited-conduct">7. Prohibited Conduct</h2>
                    <p>You agree not to:</p>
                    <ul>
                        <li>Submit false or misleading information</li>
                        <li>Engage in fraudulent activity</li>
                        <li>Attempt to exploit or manipulate the platform</li>
                        <li>Use the platform for prohibited or unlawful purposes</li>
                    </ul>
                    <p>Violations may result in account suspension or removal.</p>

                    <h2 id="operational-support-fees">8. Operational Support Fees</h2>
                    <p>Givar may apply a transparent operational support fee to transactions to support infrastructure, operations, and payment processing.</p>
                    <p>Optional contributions to support the platform may also be provided by users.</p>

                    <h2 id="limitation-of-liability">9. Limitation Of Liability</h2>
                    <p>Givar provides a platform to facilitate transparent giving but does not assume liability for:</p>
                    <ul>
                        <li>Vendor performance</li>
                        <li>Campaign outcomes</li>
                        <li>Funding shortfalls</li>
                    </ul>

                    <h2 id="modifications">10. Modifications</h2>
                    <p>Givar may update these terms from time to time. Continued use of the platform constitutes acceptance of any updates.</p>

                    <h2 id="contact">11. Contact</h2>
                    <p>For questions regarding these terms, please contact: <strong>support@givarapp.com</strong></p>
                </div>
            </div>
        </DocsLayout>
    );
}