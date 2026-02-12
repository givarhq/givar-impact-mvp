import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { ProjectGrid } from '../../../../components/features/impact/project-grid';
import { ImpactFilters } from '../../../../components/features/impact/impact-filters';

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value || '';

  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams as any);

  const [projectsResult, categories] = await Promise.all([
    ApiService.projects.list(token, params),
    ApiService.projects.getCategories(token)
  ]);

  const projects = projectsResult?.data || [];
  const meta = projectsResult?.meta || { total: 0 };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">

      <div className="space-y-6">
        <ImpactFilters
          categories={categories || []}
          totalCount={meta.total}
        />
      </div>

      <div className="min-h-[300px] pt-2">
        <ProjectGrid projects={projects} />
      </div>
    </div>
  );
}