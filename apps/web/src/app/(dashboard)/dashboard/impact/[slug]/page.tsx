import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ProjectDetailsClient } from '../../../../../components/features/impact/project-details-client';
import { Button } from '../../../../../components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

async function getProject(slug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;
    return res.json();
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
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/dashboard/impact">
        <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
        </Button>
      </Link>

      <ProjectDetailsClient project={project} />
    </div>
  );
}