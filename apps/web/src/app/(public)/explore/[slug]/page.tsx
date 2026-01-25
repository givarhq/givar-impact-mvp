import { PublicLayout } from '../../../../components/layout/public-layout';
import { ProjectDetailsClient } from '../../../../components/features/impact/project-details-client';
import { notFound } from 'next/navigation';

async function getProject(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${slug}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export default async function PublicProjectPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const project = await getProject(slug);

  if (!project) notFound();

  return (
    <PublicLayout>
        <div className="container mx-auto px-4 py-10">
            <ProjectDetailsClient project={project} isPublic={true} />
        </div>
    </PublicLayout>
  );
}