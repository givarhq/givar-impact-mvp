import { cookies } from 'next/headers';
import { ProjectGrid } from '../../../../components/features/impact/project-grid';
import { ImpactFilters } from '../../../../components/features/impact/impact-filters';
import { ApiService } from '../../../../services/api';
import { Project } from '../../../../types';

// Fetch with filters using ApiService
async function getProjects(searchParams: { [key: string]: string | string[] | undefined }): Promise<Project[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  
  if (!token) return [];

  // Construct Query String
  const params = new URLSearchParams();
  if (searchParams.search) params.set('search', searchParams.search as string);
  if (searchParams.category) params.set('category', searchParams.category as string);
  if (searchParams.sort) params.set('sort', searchParams.sort as string);
  if (searchParams.page) params.set('page', searchParams.page as string);

  try {
    const response = await ApiService.projects.list(token, params);
    return response?.data || [];
  } catch (error) {
    return [];
  }
}

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  
  const projects = await getProjects(resolvedParams);

  return (
    <div className="space-y-8 min-h-screen pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:hidden">
            Discover Impact
        </h1>
        {/* Mobile Header handled by layout/sidebar */}
        <p className="text-muted-foreground text-sm">
          Browse verified causes, filter by your interests, and fund the change you want to see in the world.
        </p>
      </div>

      {/* Filter Bar */}
      <ImpactFilters />

      {/* Main Grid */}
      <ProjectGrid projects={projects} />
      
    </div>
  );
}