import { cookies } from 'next/headers';
import { ApiService } from '../../../services/api';
import { PublicLayout } from '../../../components/layout/public-layout';
import { PublicLedgerClient } from '../../../components/features/impact/public-ledger-client';
import { Database } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Public Records',
    description: 'The immutable history of every gift and payment on Givar.',
};

export default async function GlobalRecordsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value; // Get token if exists

    const paramsObj = new URLSearchParams();
    if (resolvedParams.page) paramsObj.set('page', String(resolvedParams.page));
    if (resolvedParams.type) paramsObj.set('type', String(resolvedParams.type));

    // Pass token to API service
    const ledger = await ApiService.projects.getLedger(paramsObj, undefined, token);

    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-4 md:py-8 space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2 px-1 text-left">
                    <div className="flex items-center justify-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner shrink-0">
                            <Database className="h-5 w-5" />
                        </div>
                        <h1 className="text-xl md:text-3xl font-black tracking-tighter text-foreground">
                            Platform <span className="text-primary italic">Records</span>.
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium max-w-lg">
                        Real-time history of all capital moving through the Givar ecosystem.
                    </p>
                </div>

                <div className="w-full min-w-0">
                    <PublicLedgerClient
                        project={{ id: 'global' }}
                        initialData={ledger || { data: [], meta: { total: 0, page: 1, lastPage: 1 } }}
                    />
                </div>
            </div>
        </PublicLayout>
    );
}