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
    title, shortDesc, description, personalMessage, location, endDate,
    setProposal, updateField
  } = useProposalStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const data = await ApiService.proposals.get(proposalId);
        setProposal(data);
      } catch (error) {
        toast.error("Draft failed to load");
        router.push('/dashboard/proposals');
      } finally {
        setIsLoading(false);
      }
    };

    if (proposalId) fetchProposal();
  }, [proposalId, setProposal, router]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Validation Logic: Title, Location, and Description are required to proceed.
  const strippedDescription = description ? description.replace(/<[^>]*>?/gm, '').trim() : '';
  const isHookValid =
    title && title.trim().length >= 10 &&
    location && location.trim().length >= 2 &&
    strippedDescription.length >= 20;

  return (
    <div className="space-y-6 w-full min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <Card className="border-border/40 bg-card rounded-3xl overflow-hidden shadow-sm min-w-0">
        <CardHeader className="p-6 md:p-8 border-b border-border/40 bg-muted/10">
          <CardTitle className="text-lg md:text-xl font-bold">Cause Narrative</CardTitle>
          <CardDescription className="text-xs font-medium">
            Define your mission & impact goals. This is the first thing donors will see.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 md:p-8 pt-6 space-y-8 min-w-0">
          <div className="space-y-6 min-w-0">
            <Input
              label="Cause Title *"
              placeholder="e.g. Clean water for Owerri communities"
              value={title}
              onChange={(e) => updateField('title', e.target.value)}
              className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
            />

            <Textarea
              label="Elevator Pitch"
              placeholder="A punchy one-liner (max 140 chars)..."
              value={shortDesc || ''}
              onChange={(e) => updateField('shortDesc', e.target.value)}
              maxLength={140}
              className="h-24 rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
            />

            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-bold text-muted-foreground/80 ml-1">Cause Description *</label>
              <RichTextEditor
                content={description || ''}
                onChange={(content) => updateField('description', content)}
                placeholder="Tell the full story. Who are the beneficiaries & what is the solution?"
              />
            </div>

            <Textarea
              label="Personal Message (Optional)"
              placeholder="A direct, human appeal to your potential donors..."
              value={personalMessage || ''}
              onChange={(e) => updateField('personalMessage', e.target.value)}
              className="h-32 rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
              <Input
                label="Primary Location *"
                placeholder="e.g. Lagos, Nigeria"
                value={location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
              />

              <Input
                label="Deadline (Optional)"
                type="date"
                value={endDate ? new Date(endDate).toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateField('endDate', val ? new Date(val).toISOString() : null);
                }}
                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border/40 min-w-0 gap-4">
            <div className="w-full sm:w-auto" /> {/* Spacer */}

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {!isHookValid && (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                  Complete required fields to continue
                </span>
              )}
              <Button
                disabled={!isHookValid}
                className="w-full sm:w-auto h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 min-w-0"
                onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/media`)}
              >
                <span>Media</span> <ArrowRight className="h-4 w-4 shrink-0" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}