import { PublicLayout } from '../../../components/layout/public-layout';
import { ProjectGrid } from '../../../components/features/impact/project-grid';
import { ImpactFilters } from '../../../components/features/impact/impact-filters';
import { ApiService } from '../../../services/api';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(resolvedParams as any);

  // Fetch data via centralized service (no token required for public routes)
  const [projectsResult, categories] = await Promise.all([
    ApiService.projects.list('', params),
    ApiService.projects.getCategories('')
  ]);

  const projects = projectsResult?.data || [];
  const meta = projectsResult?.meta || { total: 0 };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 space-y-10 min-h-screen pb-24">
        {/* Header Section */}
        <div className="px-1">
          <ImpactFilters
            categories={categories || []}
            totalCount={meta.total}
          />
        </div>

        {/* Results Section */}
        <div className="min-h-[400px]">
          <ProjectGrid projects={projects} isPublic={true} />
        </div>
      </div>
    </PublicLayout>
  );
}