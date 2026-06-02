import 'dotenv/config';
import { prisma } from '../src/index';

const legalDocuments = [
    {
        slug: 'privacy',
        title: 'Privacy Policy',
        content: `
<h2 id="quick-summary">Quick Summary</h2>
<p>We are building a transparent world, but that doesn't mean you lose your privacy. Givar distinguishes strictly between <strong>public ledger data</strong> (where funds are used) and <strong>private identity data</strong> (who you are).</p>
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
    `.trim()
    },
    {
        slug: 'terms',
        title: 'Terms of Service',
        content: `
<h2 id="quick-summary">Quick Summary</h2>
<p>Givar is a platform built on trust and transparency. By using the platform, you agree to operate in good faith and in accordance with these terms.</p>
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
<p>In cases involving a material change in circumstances affecting a cause, including death, recovery, completion of need, overfunding, receipt of support from other sources, or similar events, Givar may suspend, modify, close, or otherwise administer the cause and any undisbursed donations in accordance with its policies, donor intent, and applicable law.</p>

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
    `.trim()
    },
    {
        slug: 'refund',
        title: 'Refund Policy',
        content: `
<p>Givar operates a transparent giving platform where contributions are made to support verified causes.</p>

<h2 id="finality-of-contributions">1. Finality of Contributions</h2>
<p>Contributions made on Givar are generally considered final once a transaction is successfully processed. As payments are directed to verified vendors or institutions for specific project phases, Givar cannot guarantee a refund once funds have been settled into the vendor's bank account.</p>

<h2 id="exception-handling">2. Exception Handling and Vendor Coordination</h2>
<p>In the event of confirmed fraud, misrepresentation, or if a project cannot proceed as planned, Givar will intervene to protect donor interests. Our ability to issue a refund is dependent on the following:</p>
<ul>
    <li><strong>Settlement Status:</strong> If the funds have not yet been settled into the vendor's account, Givar may be able to cancel the transaction.</li>
    <li><strong>Vendor Return:</strong> If funds have already been settled, Givar will coordinate with the institution to secure the return of the unused capital. A refund can only be triggered to the donor once the vendor has returned the funds to Givar's corporate account.</li>
</ul>

<h2 id="payment-processing-errors">3. Payment Processing Errors</h2>
<p>If a donor experiences a confirmed duplicate charge or technical payment error, Givar will work with our payment gateway providers to resolve the issue as quickly as possible.</p>

<h2 id="currency-conversion">4. Currency Conversion</h2>
<p>For international donors, the final amount refunded may vary slightly from the original amount given due to fluctuations in exchange rates or bank processing fees. Givar is not responsible for these discrepancies.</p>

<h2 id="contact">5. Contact</h2>
<p>For refund-related inquiries, please contact: <strong>support@givarapp.com</strong></p>
    `.trim()
    },
    {
        slug: 'cancellation',
        title: 'Cancellation Policy',
        content: `
<h2 id="cause-withdrawal">1. Cause Withdrawal</h2>
<p>Organisers may withdraw their cause submission at any time before it has been approved for the public feed. Once a cause is live and receiving donations, withdrawal is subject to administrative review to ensure the protection of already-received capital.</p>

<h2 id="platform-intervention">2. Platform Intervention</h2>
<p>Givar reserves the right to pause, suspend, or remove any cause where there are concerns regarding the accuracy of information, beneficiary authorization, vendor verification, or fraud risk. In such cases, Givar will immediately halt all further donations and disbursements.</p>

<h2 id="impact-on-received-funds">3. Impact on Received Funds</h2>
<p>If a cause is cancelled after funds have been raised, Givar will take steps to ensure the capital is handled in accordance with the donors' original intent. This may include:</p>
<ul>
    <li><strong>Refunds:</strong> Coordinating with the vendor to return the funds for refunding to donors.</li>
    <li><strong>Redirection:</strong> With donor consent, redirecting the funds to another verified cause within the same sector (e.g., from one medical cause to another).</li>
    <li><strong>Ledger Adjustment:</strong> Holding the funds in the platform suspense ledger until an audited resolution is achieved.</li>
</ul>

<h2 id="organiser-responsibilities">4. Organiser Responsibilities</h2>
<p>Submitting misleading, unauthorized, or fraudulent causes is a violation of platform policy. Such actions will result in permanent account termination and, where appropriate, reporting to regulatory or legal authorities.</p>

<h2 id="contact">5. Contact</h2>
<p>For cancellation-related queries, please contact: <strong>compliance@givarapp.com</strong></p>
    `.trim()
    },
    {
        slug: 'agreement',
        title: 'Cause Organiser Agreement',
        content: `
<p>By submitting a cause on Givar, you agree to the following terms.</p>

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

<h2 id="material-changes">7. Material Changes in Circumstances</h2>
<p>If a cause can no longer proceed as originally presented due to the death of a beneficiary, recovery, completion of the need, receipt of support from other sources, overfunding, vendor unavailability, or any other material change in circumstances, Givar may suspend, modify, close, or otherwise administer the cause at its discretion.</p>
<p>Donations raised through Givar do not become the property of an organiser or beneficiary solely because they were raised for a particular cause. Any undisbursed funds affected by a material change in circumstances may be applied toward verified outstanding expenses related to the cause, reasonable associated costs, similar verified causes or charitable purposes, or otherwise handled by Givar in a manner consistent with donor intent and applicable law.</p>

<h2 id="beneficiary-consent">8. Beneficiary Consent and Indemnification</h2>
<p>You are responsible for ensuring that you have the necessary permissions, consents, and authorisations to submit the information, documents, and images provided in connection with a cause.</p>
<p>You agree to indemnify and hold Givar harmless from claims arising from inaccurate information, unauthorised disclosures, or a lack of required consent relating to your submission.</p>

<h2 id="misrepresentation">9. Misrepresentation</h2>
<p>Knowingly submitting false, misleading, or unauthorised causes may result in account suspension and potential legal reporting.</p>

<h2 id="contact">10. Contact</h2>
<p>For questions regarding cause submissions, please contact: <strong>support@givarapp.com</strong></p>
    `.trim()
    },
    {
        slug: 'partner-agreement',
        title: 'Partner Agreement',
        content: `
<p>These Partner Terms outline the expectations for vendors, institutions, and service providers participating in campaigns on Givar.</p>

<h2 id="role-of-givar">1. Role Of Givar</h2>
<p>Givar is a technology platform that connects donors to verified causes and facilitates direct payments to approved vendors. Givar does not operate as a financial custodian or escrow agent.</p>

<h2 id="phased-funding">2. Phased And Incremental Funding</h2>
<p>Campaigns are structured in budget phases. As a Partner, you will receive funds incrementally into your designated account as donors contribute. Execution of services should align with confirmed funds received.</p>

<h2 id="direct-routing">3. Direct Routing</h2>
<p>Funds are routed directly to your institution's bank account via authorized payment gateways. No funds are handled by campaign organizers.</p>

<h2 id="partial-funding">4. Partial Funding</h2>
<p>If a campaign does not reach its full goal, you are expected to adjust the scope of services provided and not proceed beyond the costs covered by the available funds received.</p>

<h2 id="mandatory-return-unused-funds">5. Mandatory Return Of Unused Funds</h2>
<p>In the event that a campaign is canceled, cannot proceed as planned, or funds received exceed the final cost of services rendered, you are <strong>legally obligated to return the unused balance</strong> to Givar's corporate account.</p>
<p>This allows Givar to trigger appropriate refunds to the original donors via our payment gateway. Failure to return unused capital will result in removal from the platform and potential legal action.</p>

<h2 id="verification-audit">6. Verification and Audit</h2>
<p>Partners must provide photographic proof of work, invoices, and execution receipts directly to Givar's audit team upon request. This data is required to verify impact for donors and to unlock subsequent funding phases.</p>

<h2 id="misuse">7. Misuse</h2>
<p>Any misuse or misrepresentation of funds will result in permanent exclusion from the Givar ecosystem.</p>

<h2 id="contact">8. Contact</h2>
<p>For partner-related inquiries, please contact: <strong>partners@givarapp.com</strong></p>
    `.trim()
    },
    {
        slug: 'acceptable-use',
        title: 'Acceptable Use Policy',
        content: `
<p>This Acceptable Use Policy outlines the types of activities, causes, and fundraising purposes permitted on the Givar platform.</p>
<p>Givar is designed exclusively to support transparent social impact initiatives. All users must comply with the rules below when creating campaigns, receiving funds, or participating in platform activities.</p>

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
<p>Campaign organizers must undergo identity verification and provide supporting documentation relevant to the cause. This may include government-issued identification, beneficiary documentation, vendor invoices, institutional letters, or other evidence requested by Givar's compliance team.</p>
<p>Givar reserves the right to reject or remove campaigns that do not meet verification standards.</p>

<h2 id="platform-enforcement">4. Platform Enforcement</h2>
<p>Givar may suspend campaigns, freeze accounts, or restrict platform access where violations of this policy are suspected or confirmed. We may also cooperate with financial institutions or regulatory authorities where required.</p>

<h2 id="policy-updates">5. Policy Updates</h2>
<p>This policy may be updated periodically to reflect regulatory changes, payment network requirements, or platform risk management practices.</p>
<p>For questions regarding acceptable campaign use, please contact <strong>support@givarapp.com</strong></p>
    `.trim()
    }
];

async function main() {
    console.log('🚀 Initiating Legal Documents Seeding Protocol...');

    // 1. Fetch a SuperAdmin to assign ownership of these documents
    const admin = await prisma.user.findFirst({
        where: { role: 'SUPERADMIN' },
        select: { id: true }
    });

    if (!admin) {
        console.error('❌ No SuperAdmin found in the database. A SuperAdmin is required as the author of legal documents.');
        process.exit(1);
    }

    // 2. Upsert each document exactly as formulated above
    let count = 0;
    for (const doc of legalDocuments) {
        await prisma.legalDocument.upsert({
            where: { slug: doc.slug },
            update: {
                title: doc.title,
                content: doc.content,
                lastUpdatedBy: admin.id
            },
            create: {
                slug: doc.slug,
                title: doc.title,
                content: doc.content,
                lastUpdatedBy: admin.id
            }
        });
        count++;
    }

    console.log(`✅ Successfully injected ${count} legal documents into the database.`);
    console.log('You can now proceed to wipe the static files and replace them with the server-side fetched CMS content.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });