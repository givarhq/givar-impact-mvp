'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, ArrowRight, Trash2, Loader2 } from 'lucide-react';
import { MediaManager, ImageUploader } from '../../../../../../../../components/features/proposals/media-uploader';
import toast from 'react-hot-toast';
import { Badge } from '../../../../../../../../components/ui/badge';

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
      .then((data) => {
        setProposal(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error('Could not load proposal draft.');
        router.push('/dashboard/proposals');
      });
  }, [proposalId, setProposal, router]);

  const handleCoverUpload = (data: { key: string; previewUrl: string }) => {
    updateField('coverImage', data.previewUrl);
    updateField('coverImageKey', data.key);
  };

  const handleRemoveCover = () => {
    updateField('coverImage', null);
    updateField('coverImageKey', null);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin mr-3" /> Initializing Media Assets...
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Media & Proof</CardTitle>
        <CardDescription>
          A great cover image is crucial. Use the gallery to add detailed photos, videos, or documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-10 px-0">

        {/* Section 1: Cover Image (Single) */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Cover Image (Required)</label>
          {coverImage ? (
            <div className="relative w-full aspect-video rounded-3xl overflow-hidden group border border-border shadow-md">
              <img src={coverImage} alt="Cover" className="object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                <Button variant="destructive" className="rounded-xl font-bold h-11" onClick={handleRemoveCover}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove Cover Image
                </Button>
              </div>
            </div>
          ) : (
            <ImageUploader
              useCase="public"
              onUploadComplete={handleCoverUpload}
              label="Click to Upload Cover Image (Landscape)"
            />
          )}
        </div>

        {/* Section 2: Detailed Media Gallery */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline px-1">
            <label className="text-sm font-medium text-foreground">Project Gallery</label>
            <Badge variant="secondary" className="rounded-lg h-5 text-[10px]">{gallery.length} items</Badge>
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
          <Button variant="outline" className="rounded-xl h-11 px-6" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/hook`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Hook
          </Button>
          <Button size="lg" className="h-11 rounded-xl px-10 shadow-lg shadow-primary/20 font-bold" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/plan`)}>
            Next: Execution Plan <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}