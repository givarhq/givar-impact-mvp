'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowLeft, ArrowRight, Trash2, Loader2, Camera, ImageIcon } from 'lucide-react';
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
      .then((data) => {
        setProposal(data);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error('Draft failed to load');
        router.push('/dashboard/proposals');
      });
  }, [proposalId, setProposal, router]);

  const handleCoverUpload = (data: { key: string; previewUrl: string }) => {
    updateField('coverImage', data.previewUrl);
    updateField('coverImageKey', data.key);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">

      <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm min-w-0">
        <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-2 text-primary mb-1 min-w-0">
            <Camera className="h-4 w-4 shrink-0" />
            <span className="text-[11px] font-bold  tracking-[0.2em]">Visuals</span>
          </div>
          <CardTitle className="text-lg md:text-xl font-bold">Project media</CardTitle>
          <CardDescription className="text-xs font-medium">
            High-quality visuals build trust & help donors connect with your cause mission.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 pt-6 space-y-10 min-w-0">
          {/* Cover Asset Section */}
          <div className="space-y-4 min-w-0">
            <div className="flex items-center gap-2 px-1">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <label className="text-[11px] font-bold text-muted-foreground  tracking-widest">Primary hero image</label>
            </div>
            {coverImage ? (
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/40 group shadow-md bg-muted">
                <Image
                  src={coverImage}
                  alt="Cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover transition-transform group-hover:scale-105 duration-700"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                  <Button
                    variant="destructive"
                    className="rounded-3xl font-bold h-10 px-6 text-xs active:scale-95 transition-all shadow-lg"
                    onClick={() => {
                      updateField('coverImage', null);
                      updateField('coverImageKey', null);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Remove hero
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-48 md:h-64">
                <ImageUploader
                  useCase="public"
                  onUploadComplete={handleCoverUpload}
                  label="Upload project hero image"
                />
              </div>
            )}
          </div>

          {/* Gallery Section */}
          <div className="space-y-4 min-w-0 pt-4 border-t border-border/40">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-muted-foreground  tracking-widest">Project gallery</label>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-3xl border border-primary/10">{gallery.length} / 10 assets</span>
            </div>

            <MediaManager
              items={gallery}
              onAdd={addGalleryItem}
              onRemove={removeGalleryItem}
              onUpdate={updateGalleryItem}
            />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-border/40 min-w-0 gap-4">
            <Button
              variant="outline"
              className="rounded-3xl h-12 px-6 text-xs font-bold border-border/60 text-muted-foreground hover:bg-muted transition-all active:scale-95 min-w-0"
              onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/hook`)}
            >
              <span>Back</span>
            </Button>
            <Button
              className="h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 min-w-0"
              onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/plan`)}
            >
              <span>Execution</span> <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}