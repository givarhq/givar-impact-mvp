import { cookies } from 'next/headers';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ApiService } from '../../../../services/api';
import { Button } from '../../../../components/ui/button';
import { AdminProjectFilters } from '../../../../components/features/admin/admin-project-filters';
import { AdminProjectTable } from '../../../../components/features/admin/admin-project-table';
import { Pagination } from '../../../../components/features/history/pagination';

export default async function AdminProjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;
    if (!token) return null;

    const resolvedParams = await searchParams;
    const params = new URLSearchParams(resolvedParams as any);

    const [result, categories] = await Promise.all([
        ApiService.admin.getProjects(token, params),
        ApiService.projects.getCategories(token)
    ]);

    const projects = result?.data || [];
    const meta = result?.meta || { page: 1, lastPage: 1 };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:hidden">Project Management</h1>
                <Link href="/admin/projects/new" className="ml-auto">
                    <Button className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-10 px-5 border-0">
                        <Plus className="mr-2 h-4 w-4" /> New Project
                    </Button>
                </Link>
            </div>

            <AdminProjectFilters categories={categories || []} />

            <AdminProjectTable
                projects={projects}
                currentSort={String(resolvedParams.sortBy || 'createdAt')}
                currentOrder={String(resolvedParams.sortOrder || 'desc')}
            />

            <Pagination currentPage={meta.page} totalPages={meta.lastPage} />
        </div>
    );
}