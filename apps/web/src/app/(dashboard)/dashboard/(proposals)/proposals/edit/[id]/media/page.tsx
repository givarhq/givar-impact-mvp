'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { ImageUploader } from '../../../../../../../../components/features/proposals/media-uploader';
import toast from 'react-hot-toast';

export default function MediaPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;
  
  // SOTA: Connect to the Zustand store
  const { 
      coverImage, gallery, setProposal, 
      updateField, addGalleryImage, removeGalleryImage 
  } = useProposalStore();

  const [isLoading, setIsLoading] = useState(true);

  // SOTA: Fetch initial data and hydrate the store on page load
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
          A great cover image is crucial. Add a gallery to tell a richer story.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Cover Image */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Cover Image</label>
          {coverImage ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
              <img src={coverImage} alt="Cover" className="object-cover w-full h-full" />
              <Button size="icon" variant="destructive" onClick={() => updateField('coverImage', null)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <ImageUploader useCase="public" onUploadComplete={(url) => updateField('coverImage', url)} label="Upload Cover Image" />
          )}
        </div>
        
        {/* Gallery */}
        <div className="space-y-3">
            <label className="text-sm font-medium">Image Gallery (up to 5)</label>
            <div className="grid grid-cols-3 gap-4">
                {gallery.map(url => (
                    <div key={url} className="relative aspect-square rounded-xl overflow-hidden group">
                         <img src={url} alt="Gallery" className="object-cover w-full h-full" />
                         <Button size="icon" variant="destructive" onClick={() => removeGalleryImage(url)} className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
                {gallery.length < 5 && (
                    <ImageUploader useCase="public" onUploadComplete={addGalleryImage} label="Add Image" />
                )}
            </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8">
            <Button variant="outline" className="rounded-xl" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/`)}>
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