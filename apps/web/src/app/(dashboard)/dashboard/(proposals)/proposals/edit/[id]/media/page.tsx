'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { MediaManager, ImageUploader } from '../../../../../../../../components/features/proposals/media-uploader';
import toast from 'react-hot-toast';

export default function MediaPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  
  const { 
      coverImage, gallery, setProposal, 
      updateField, addGalleryItem, removeGalleryItem, updateGalleryItem
  } = useProposalStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    ApiService.proposals.get(proposalId)
      .then(data => {
        setProposal(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error('Could not load proposal draft.');
        router.push('/dashboard');
      });
  }, [proposalId, setProposal, router]);

  if (isLoading) return <div>Loading Draft...</div>;

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">The Evidence</CardTitle>
        <CardDescription>
          A great cover image is crucial. Use the gallery to add detailed photos, videos, or documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-10">
        
        {/* Section 1: Cover Image (Single) */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Cover Image (Required)</label>
          {coverImage ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden group border border-border">
              <img src={coverImage} alt="Cover" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" onClick={() => updateField('coverImage', null)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Remove Cover
                  </Button>
              </div>
            </div>
          ) : (
            <ImageUploader 
                useCase="public" 
                onUploadComplete={(url) => updateField('coverImage', url)} 
                label="Click to Upload Cover Image (Landscape)" 
            />
          )}
        </div>
        
        {/* Section 2: Detailed Media Gallery (SOTA Manager) */}
        <div className="space-y-3">
            <div className="flex justify-between items-baseline">
                <label className="text-sm font-medium">Project Gallery</label>
                <span className="text-xs text-muted-foreground">{gallery.length} items</span>
            </div>
            
            <MediaManager 
                items={gallery}
                onAdd={addGalleryItem}
                onRemove={removeGalleryItem}
                onUpdate={updateGalleryItem}
            />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-border">
            <Button variant="outline" className="rounded-xl" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/hook`)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Button size="lg" className="h-12 rounded-xl" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/plan`)}>
                Next: The Plan <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}