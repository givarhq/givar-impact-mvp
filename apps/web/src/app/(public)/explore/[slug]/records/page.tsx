import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ApiService } from '../../../../../services/api';
import { PublicLayout } from '../../../../../components/layout/public-layout';
import { PublicLedgerClient } from '../../../../../components/features/impact/public-ledger-client';
import { Button } from '../../../../../components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Public Records',
    description: 'View the complete giving history and payment records for this project.',
};

export default async function PublicProjectLedgerPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { slug } = await params;
    const resolvedParams = await searchParams;
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value || '';

    // 1. Fetch Project for context
    const project = await ApiService.projects.get(token, slug);
    if (!project) notFound();

    // 2. Fetch Initial Ledger Data
    const paramsObj = new URLSearchParams();
    if (resolvedParams.page) paramsObj.set('page', String(resolvedParams.page));
    if (resolvedParams.type) paramsObj.set('type', String(resolvedParams.type));

    const initialLedger = await ApiService.projects.getLedger(slug, paramsObj);

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 px-1">
                    <Link href={`/explore/${slug}`} className="w-fit">
                        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to project
                        </Button>
                    </Link>

                    <div className="space-y-1">
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                            Public Records
                        </h1>
                        <p className="text-sm text-muted-foreground font-medium">
                            Verified giving and payment history for <span className="text-foreground font-bold">{project.title}</span>
                        </p>
                    </div>
                </div>

                <div className="w-full min-w-0">
                    <PublicLedgerClient
                        project={project}
                        initialData={initialLedger || { data: [], meta: { total: 0, page: 1, lastPage: 1 } }}
                    />
                </div>
            </div>
        </PublicLayout>
    );
}