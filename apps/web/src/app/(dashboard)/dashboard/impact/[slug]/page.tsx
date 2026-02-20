import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ProjectDetailsClient } from '../../../../../components/features/impact/project-details-client';
import { Button } from '../../../../../components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ApiService } from '../../../../../services/api';

export const metadata = {
  title: 'Cause Details',
  description: 'View project narrative, execution plans, & real-time impact updates.',
};

async function getProject(slug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  try {
    return await ApiService.projects.get(token, slug);
  } catch (error) {
    return null;
  }
}

export default async function ProjectDetailsPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;

  const project = await getProject(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {/* Navigation Header */}
      <div className="flex flex-col gap-4 px-1 min-w-0">
        <Link href="/dashboard/impact" className="w-fit">
          <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Explore
          </Button>
        </Link>
      </div>

      <div className="w-full min-w-0">
        <ProjectDetailsClient project={project} />
      </div>
    </div>
  );
}
