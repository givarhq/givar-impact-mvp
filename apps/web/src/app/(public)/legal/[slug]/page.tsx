import { notFound } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { DocsLayout } from '../../../../components/layout/docs-layout';
import { cn } from '../../../../lib/utils/cn';

// Ensure Next.js dynamic routing with instant revalidation
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const doc = await ApiService.legalDocs.getPublicBySlug(slug);
    if (!doc) return { title: 'Document Not Found' };
    return {
        title: `${doc.title} | Givar`,
        description: `Verify our official ${doc.title.toLowerCase()} policies and agreements.`,
    };
}

// XSS Sanitizer to verify raw database HTML safety
const sanitizeHtml = (html: string): string => {
    if (!html) return '';
    let decoded = html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return decoded
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/on\w+\s*=\s*"(?:[^"]*)"/gi, '')
        .replace(/on\w+\s*=\s*'(?:[^']*)'/gi, '')
        .replace(/on\w+\s*=\s*([^"\s>]+)/gi, '')
        .replace(/href\s*=\s*"(javascript:[^"]*)"/gi, '')
        .replace(/href\s*=\s*'(javascript:[^']*)'/gi, '');
};

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch the target policy and the complete corpus in parallel for instantaneous search loading
    const [doc, allDocs] = await Promise.all([
        ApiService.legalDocs.getPublicBySlug(slug),
        ApiService.legalDocs.getAllPublic().catch(() => [])
    ]);

    if (!doc) {
        notFound();
    }

    return (
        <DocsLayout initialDocs={allDocs || []}>
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2 border-b border-border/40 pb-6">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                        {doc.title}
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Last updated: {new Date(doc.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>

                <div
                    className={cn(
                        "max-w-none text-sm text-foreground leading-loose font-medium break-words",
                        "[&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border/40 first:[&_h2]:border-none first:[&_h2]:pt-0 first:[&_h2]:mt-0",
                        "[&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-3",
                        "[&_p]:text-foreground [&_p]:mb-6 [&_p]:last:mb-0",
                        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6 [&_ul]:space-y-3 [&_ul]:text-foreground [&_ul_li::marker]:text-primary/50",
                        "[&_strong]:font-bold [&_strong]:text-foreground",
                        "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors"
                    )}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(doc.content) }}
                />
            </div>
        </DocsLayout>
    );
}