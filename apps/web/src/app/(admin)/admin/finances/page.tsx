import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { FinanceReportClient } from '../../../../components/features/admin/finances/finance-report-client';

export const metadata = {
    title: 'Treasury Intelligence',
    description: 'Financial monitoring, capital distribution, & institutional reporting.',
};

export default async function AdminFinancesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) return null;

    const resolvedParams = await searchParams;

    const params = new URLSearchParams(resolvedParams as any);

    // Parallel fetch: Categories for filter + Full Finance Report
    const [categories, report] = await Promise.all([
        ApiService.projects.getCategories(token),
        ApiService.admin.getFinanceReport(params)
    ]);


    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Page Identity (Mobile Only) */}
            <div className="md:hidden px-1">
                <h1 className="text-lg font-bold tracking-tight text-foreground">Treasury Intelligence</h1>
            </div>

            <FinanceReportClient
                categories={categories || []}
                report={report}
            />
        </div>
    );
}