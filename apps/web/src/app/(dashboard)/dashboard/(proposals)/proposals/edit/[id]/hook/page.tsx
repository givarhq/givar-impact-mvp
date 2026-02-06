'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { Input } from '../../../../../../../../components/ui/input';
import { Textarea } from '../../../../../../../../components/ui/textarea';
import { RichTextEditor } from '../../../../../../../../components/ui/rich-text-editor';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HookPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const {
    title, shortDesc, description, location,
    setProposal, updateField
  } = useProposalStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const data = await ApiService.proposals.get(proposalId);
        setProposal(data);
      } catch (error) {
        toast.error("Failed to load proposal draft");
        router.push('/dashboard/proposals');
      } finally {
        setIsLoading(false);
      }
    };

    if (proposalId) {
      fetchProposal();
    }
  }, [proposalId, setProposal, router]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Initializing Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent animate-in fade-in duration-500">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">The Hook</CardTitle>
        <CardDescription className="text-base">
          Craft a compelling story. Use formatting to highlight your impact and make the proposal readable for donors.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 px-0 mt-4">
        <div className="space-y-6">
          <Input
            label="Project Title"
            placeholder="e.g., Clean Water for Owerri Community"
            value={title}
            onChange={(e) => updateField('title', e.target.value)}
          />

          <Textarea
            label="Elevator Pitch (140 characters)"
            placeholder="A punchy one-liner that appears on discovery cards..."
            value={shortDesc || ''}
            onChange={(e) => updateField('shortDesc', e.target.value)}
            maxLength={140}
            className="h-20"
          />

          <RichTextEditor
            label="Full Project Description"
            content={description || ''}
            onChange={(content) => updateField('description', content)}
            placeholder="Tell the full story. Who are the beneficiaries? What is the core problem and your verified solution?"
          />

          <Input
            label="Target Location"
            placeholder="e.g., Lagos, Nigeria"
            value={location || ''}
            onChange={(e) => updateField('location', e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-8 border-t border-border/50">
          <Button
            size="lg"
            className="h-12 rounded-xl px-10 shadow-xl shadow-primary/20 font-bold gap-2 active:scale-95 transition-all"
            onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/media`)}
          >
            Next: Media & Evidence <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}