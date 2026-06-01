import { DocsLayout } from '../../../../components/layout/docs-layout';
import { Metadata } from 'next';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Cause Organiser Agreement',
    description: 'Terms and responsibilities for launching and managing a cause on Givar.',
};

export default function AgreementPage() {
    return (
        <DocsLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2 border-b border-border/40 pb-6">
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                        Cause Organiser Agreement
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Last updated: 28 May 2026
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
                        By submitting a cause on Givar, you agree to the following terms.
                    </p>

                    <h2 id="authority-and-accuracy">1. Authority and Accuracy</h2>
                    <p>You confirm that all information provided about the cause, beneficiary, and vendors is accurate to the best of your knowledge.</p>
                    <p>You also confirm that you are authorised to submit this cause and have obtained any consent or authorisation reasonably required to share the information, documents, and images provided in connection with the cause.</p>

                    <h2 id="beneficiary-awareness">2. Beneficiary Awareness</h2>
                    <p>You confirm that the beneficiary or their legal guardian is aware of and has authorised the fundraising effort where reasonably possible given the circumstances.</p>

                    <h2 id="verification-process">3. Verification Process</h2>
                    <p>You agree to cooperate with Givar's verification process, including responding to requests for additional information or documentation.</p>
                    <p>Failure to provide requested information may result in delays, rejection, or suspension of the cause.</p>

                    <h2 id="platform-discretion">4. Platform Discretion</h2>
                    <p>Givar reserves the right to approve, reject, pause, or remove causes at its discretion where verification concerns, policy issues, or fraud risks arise.</p>

                    <h2 id="phased-vendor-disbursements">5. Phased Vendor Disbursements</h2>
                    <p>You understand that funds raised on Givar are <strong>never paid to organisers personally</strong>. Donations are processed via authorized third-party gateways and routed directly to verified vendor accounts (such as hospitals or schools). Givar acts solely as the verifiable technology layer ensuring payments only route when milestones are met.</p>
                    <ul>
                        <li><strong>Phased Funding:</strong> Campaigns are funded in distinct phases according to the approved budget roadmap. Inbound donations will pause automatically when an active phase is fully funded.</li>
                        <li><strong>Direct Routing:</strong> Givar will authorize the routing of funds directly to verified vendors for the completion of that specific phase.</li>
                        <li><strong>Administrative Audit:</strong> Deliverables for each phase are verified directly between Givar and the vendor. Subsequent funding phases will not open until execution is confirmed on the ledger.</li>
                    </ul>

                    <h2 id="updates-and-transparency">6. Updates and Transparency</h2>
                    <p>You agree to keep information relating to your cause accurate and up to date and to reasonably cooperate with the Givar team to maintain transparency for donors.</p>
                    <p>This includes notifying Givar if any approved cost item becomes fully funded, partially funded, reduced, cancelled, completed, or otherwise materially changes after submission, including through donations or other support received outside the platform, and maintaining the accuracy of any vendor information provided.</p>

                    <h2 id="beneficiary-consent">7. Beneficiary Consent and Indemnification</h2>
                    <p>You are responsible for ensuring that you have the necessary permissions, consents, and authorisations to submit the information, documents, and images provided in connection with a cause.</p>
                    <p>You agree to indemnify and hold Givar harmless from claims arising from inaccurate information, unauthorised disclosures, or a lack of required consent relating to your submission.</p>

                    <h2 id="misrepresentation">8. Misrepresentation</h2>
                    <p>Knowingly submitting false, misleading, or unauthorised causes may result in account suspension and potential legal reporting.</p>

                    <h2 id="contact">9. Contact</h2>
                    <p>For questions regarding cause submissions, please contact: <strong>support@givarapp.com</strong></p>
                </div>
            </div>
        </DocsLayout>
    );
}