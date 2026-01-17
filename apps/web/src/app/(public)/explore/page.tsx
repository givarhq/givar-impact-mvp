import { PublicLayout } from '../../../components/layout/public-layout';
import { ProjectGrid } from '../../../components/features/impact/project-grid';
import { ImpactFilters } from '../../../components/features/impact/impact-filters';
import { Project } from '../../../types';
import { cookies } from 'next/headers';

async function getProjects(searchParams: any): Promise<Project[]> {
  const params = new URLSearchParams(searchParams);
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    return [];
  }
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  await cookies();
  
  const projects = await getProjects(resolvedParams);

  return (
    <PublicLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* SOTA UPDATE: Removed noisy hero text. Straight to business. */}
            <div className="flex flex-col gap-2 mb-4">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Explore Causes</h1>
                <p className="text-sm text-muted-foreground">
                    Discover and support verified projects.
                </p>
            </div>

            <ImpactFilters />
            
            <ProjectGrid projects={projects} />
        </div>
    </PublicLayout>
  );
}