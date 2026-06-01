import { DocsLayout } from '../../../../components/layout/docs-layout';
import { Metadata } from 'next';
import { cn } from '../../../../lib/utils/cn';

export const metadata: Metadata = {
    title: 'Refund Policy',
    description: 'Information regarding the finality of contributions and exception handling on the Givar platform.',
};

export default function RefundPolicyPage() {
    return (
        <DocsLayout>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2 border-b border-border/40 pb-6">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                        Refund Policy
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
                    <p>
                        Givar operates a transparent giving platform where contributions are made to support verified causes.
                    </p>

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
                </div>
            </div>
        </DocsLayout>
    );
}