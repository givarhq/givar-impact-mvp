import { PublicLayout } from '../../../../components/layout/public-layout';
import { ProjectDetailsClient } from '../../../../components/features/impact/project-details-client';
import { notFound } from 'next/navigation';
import { Button } from '../../../../components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Cause Details',
  description: 'Learn about the mission, execution roadmap, & real-time updates for this verified project.',
};

async function getProject(slug: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/${slug}`, {
      next: { revalidate: 60 }, // Public cache revalidation
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
      <div className="container mx-auto px-4 py-6 md:py-10 space-y-4 md:space-y-6 min-w-0 overflow-hidden animate-in fade-in duration-500">
        {/* Navigation Header */}
        <div className="flex flex-col gap-4 px-1 min-w-0">
          <Link href="/explore" className="w-fit">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Explore
            </Button>
          </Link>
        </div>

        <div className="w-full min-w-0">
          <ProjectDetailsClient project={project} isPublic={true} />
        </div>
      </div>
    </PublicLayout>
  );
}