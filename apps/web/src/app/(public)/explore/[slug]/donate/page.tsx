import { notFound } from 'next/navigation';
import { ApiService } from '../../../../../services/api';
import { DonationForm } from '../../../../(dashboard)/dashboard/impact/[slug]/donate/donation-form';
import { PublicLayout } from '../../../../../components/layout/public-layout';
import { ArrowLeft, Target } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../../../../components/ui/button';
import { SmartCurrency } from '../../../../../components/ui/smart-currency';

export const metadata = {
  title: 'Support This Cause',
  description: 'Contribute to this verified mission and track your impact on the transparent ledger.',
};

export default async function PublicDonationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch Project data publicly (no token)
  const project = await ApiService.projects.get('', slug);
  if (!project) notFound();

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8 pb-24 min-w-0 overflow-hidden animate-in fade-in duration-500">

        {/* Navigation Header */}
        <div className="flex flex-col gap-4 px-1 min-w-0">
          <Link href={`/explore/${slug}`} className="w-fit">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground -ml-4 group rounded-3xl">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to details
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-w-0">
          {/* Project Summary Sidebar */}
          <div className="lg:col-span-4 space-y-6 min-w-0">
            <div className="aspect-video rounded-[32px] overflow-hidden border border-border/40 shadow-sm bg-muted min-w-0">
              {project.imageUrl && (
                <img src={project.imageUrl} className="w-full h-full object-cover" alt={project.title} />
              )}
            </div>
            <div className="space-y-4 px-1 min-w-0">
              <div className="space-y-1 min-w-0">
                <h2 className="text-xl font-bold tracking-tight text-foreground leading-tight truncate-2-lines">{project.title}</h2>
                <div className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-widest">
                  <Target className="h-3.5 w-3.5" />
                  Goal: <SmartCurrency amount={project.targetAmount} currency={project.currency} visible={true} size="small" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium line-clamp-6 italic min-w-0">
                {project.description}
              </p>
            </div>
          </div>

          {/* Donation Terminal */}
          <div className="lg:col-span-8 min-w-0">
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