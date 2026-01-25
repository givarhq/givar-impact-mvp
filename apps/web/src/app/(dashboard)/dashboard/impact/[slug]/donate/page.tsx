import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { ApiService } from '../../../../../../services/api';
import { Project, Wallet } from '../../../../../../types';
import { DonationForm } from './donation-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../../../components/ui/button';

export default async function DonationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  const userCookie = cookieStore.get('givar_user')?.value;

  const isAuthenticated = !!token && !!userCookie;

  // Fetch Project
  const project = await ApiService.projects.get(token || '', slug);
  if (!project) notFound();

  // Fetch Wallet if authenticated
  let wallet: Wallet | null = null;
  if (isAuthenticated && token) {
    wallet = await ApiService.wallet.get(token);
  }

  // Context-aware back-link to prevent redirect loops for guests
  const backLink = isAuthenticated 
    ? `/dashboard/impact/${slug}` 
    : `/explore/${slug}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Link href={backLink}>
        <Button variant="ghost" className="text-muted-foreground hover:text-foreground -ml-4 group rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Project Details
        </Button>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Project Mini-Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="aspect-video rounded-3xl overflow-hidden border border-border/50 shadow-sm bg-muted">
            {project.imageUrl && (
              <img src={project.imageUrl} className="w-full h-full object-cover" alt={project.title} />
            )}
          </div>
          <div className="space-y-2 px-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.title}</h1>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-6 italic">
              {project.description}
            </p>
          </div>
        </div>

        {/* The Form Column */}
        <div className="lg:col-span-3">
          <DonationForm 
            project={project} 
            wallet={wallet} 
            isAuthenticated={isAuthenticated} 
          />
        </div>
      </div>
    </div>
  );
}