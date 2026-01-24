'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { Input } from '../../../../../../../../components/ui/input';
import { Textarea } from '../../../../../../../../components/ui/textarea'; // Imported Textarea
import { ApiService } from '../../../../../../../../services/api';
import { ArrowRight } from 'lucide-react';

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
    ApiService.proposals.get(proposalId)
      .then(data => {
        setProposal(data);
        setIsLoading(false);
      })
      .catch(() => router.push('/dashboard'));
  }, [proposalId, setProposal, router]);

  if (isLoading) return <div>Loading Draft...</div>;

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">The Hook</CardTitle>
        <CardDescription>
          Craft a compelling story. This is the first thing donors will see.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <Input 
            label="Project Title"
            value={title}
            onChange={(e) => updateField('title', e.target.value)}
        />

        <Textarea 
            label="Short Summary (140 chars)"
            placeholder="A punchy tagline for card views..."
            value={shortDesc || ''}
            onChange={(e) => updateField('shortDesc', e.target.value)}
            maxLength={140}
        />

        <Textarea 
            label="Full Description"
            className="min-h-[200px]"
            placeholder="Tell the full story. Who are the beneficiaries? What is the problem? What is the solution?"
            value={description || ''}
            onChange={(e) => updateField('description', e.target.value)}
        />

        <Input 
            label="Location"
            placeholder="e.g., Lagos, Nigeria"
            value={location || ''}
            onChange={(e) => updateField('location', e.target.value)}
        />

        <div className="flex justify-end pt-8">
            <Button size="lg" className="h-12 rounded-xl" onClick={() => router.push(`/dashboard/proposals/edit/${proposalId}/media`)}>
                Next: The Evidence <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}