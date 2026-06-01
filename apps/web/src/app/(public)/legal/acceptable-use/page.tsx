import { DocsLayout } from '../../../../components/layout/docs-layout';
import { Metadata } from 'next';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Acceptable Use Policy',
    description: 'Outlines the types of activities, causes, and fundraising purposes permitted on the Givar platform.',
};

export default function AcceptableUsePolicyPage() {
    return (
        <DocsLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2 border-b border-border/40 pb-6">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                        Acceptable Use Policy
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Last updated: 24 May 2026
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
                    <p>
                        This Acceptable Use Policy outlines the types of activities, causes, and fundraising purposes permitted on the Givar platform.
                    </p>
                    <p>
                        Givar is designed exclusively to support transparent social impact initiatives. All users must comply with the rules below when creating campaigns, receiving funds, or participating in platform activities.
                    </p>

                    <h2 id="permitted-campaigns">1. Permitted Campaign Types</h2>
                    <p>Givar supports fundraising for legitimate social impact purposes, including but not limited to:</p>
                    <ul>
                        <li>Medical treatment and healthcare support</li>
                        <li>Educational expenses such as tuition, books, or school infrastructure</li>
                        <li>Community development initiatives</li>
                        <li>Disaster relief and emergency support</li>
                        <li>Essential welfare support for vulnerable individuals or groups</li>
                        <li>Livelihood and economic empowerment initiatives intended to help individuals or communities achieve sustainable self-sufficiency.</li>
                    </ul>
                    <p>All campaigns are subject to internal review and verification before publication.</p>

                    <h2 id="prohibited-campaigns">2. Prohibited Campaign Types</h2>
                    <p>The following activities are strictly prohibited on the platform:</p>
                    <ul>
                        <li>Fundraising for speculative business ventures, commercial expansion, investment opportunities, or profit-driven enterprises not primarily intended for basic livelihood support or community empowerment.</li>
                        <li>Campaigns offering financial returns, profit sharing, interest payments, or equity participation</li>
                        <li>Political fundraising or lobbying activities</li>
                        <li>Illegal activities or causes that violate local or international laws</li>
                        <li>Campaigns involving hate speech, discrimination, violence, or harmful content</li>
                        <li>Fraudulent or misleading fundraising representations</li>
                        <li>Attempts to raise funds for personal luxury consumption or non-essential lifestyle spending</li>
                    </ul>

                    <h2 id="verification-requirement">3. Verification Requirement</h2>
                    <p>
                        Campaign organizers must undergo identity verification and provide supporting documentation relevant to the cause. This may include government-issued identification, beneficiary documentation, vendor invoices, institutional letters, or other evidence requested by Givar's compliance team.
                    </p>
                    <p>
                        Givar reserves the right to reject or remove campaigns that do not meet verification standards.
                    </p>

                    <h2 id="platform-enforcement">4. Platform Enforcement</h2>
                    <p>
                        Givar may suspend campaigns, freeze accounts, or restrict platform access where violations of this policy are suspected or confirmed. We may also cooperate with financial institutions or regulatory authorities where required.
                    </p>

                    <h2 id="policy-updates">5. Policy Updates</h2>
                    <p>
                        This policy may be updated periodically to reflect regulatory changes, payment network requirements, or platform risk management practices.
                    </p>
                    <p>
                        For questions regarding acceptable campaign use, please contact <strong>support@givarapp.com</strong>
                    </p>
                </div>
            </div>
        </DocsLayout>
    );
}