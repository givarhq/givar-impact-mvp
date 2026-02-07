import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../../services/api';
import { ReallocateFundsClient } from '../../../../../../components/features/admin/reallocate-funds-client';

export default async function ReallocateFundsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) redirect('/login');

    const [suspenseItems, projectResult, categories] = await Promise.all([
        ApiService.admin.getSuspense(token),
        ApiService.projects.list(token, new URLSearchParams({ limit: '100', status: 'ACTIVE' })),
        ApiService.projects.getCategories(token)
    ]);

    const targetTx = suspenseItems?.find((item: any) => item.id === id);

    if (!targetTx) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <ReallocateFundsClient
                transaction={targetTx}
                initialProjects={projectResult?.data || []}
                categories={categories || []}
            />
        </div>
    );
}