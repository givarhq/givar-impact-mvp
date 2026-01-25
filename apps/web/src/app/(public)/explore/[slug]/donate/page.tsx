import { notFound } from 'next/navigation';
import { ApiService } from '../../../../../services/api';
import { DonationForm } from '../../../../(dashboard)/dashboard/impact/[slug]/donate/donation-form';
import { PublicLayout } from '../../../../../components/layout/public-layout';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../../components/ui/button';

export default async function PublicDonationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch Project data publicly (no token)
  const project = await ApiService.projects.get('', slug);
  if (!project) notFound();

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 pt-10">
        <Link href={`/explore/${slug}`}>
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground -ml-4 group rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Details
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Project Context */}
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video rounded-3xl overflow-hidden border border-border/50 shadow-sm bg-muted">
              {project.imageUrl && (
                <img src={project.imageUrl} className="w-full h-full object-cover" alt={project.title} />
              )}
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.title}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                {project.description}
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <DonationForm 
              project={project} 
              wallet={null} 
              isAuthenticated={false} 
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}