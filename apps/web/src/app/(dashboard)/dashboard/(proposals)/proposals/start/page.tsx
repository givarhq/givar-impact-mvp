'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../components/ui/card';
import { Button } from '../../../../../../components/ui/button';
import { Input } from '../../../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../../components/ui/select';
import { ApiService } from '../../../../../../services/api';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight } from 'lucide-react';

const startSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  categoryId: z.string().uuid('Please select a category'),
});

type StartFormValues = z.infer<typeof startSchema>;

// Category Type for state
interface Category {
  id: string;
  name: string;
}

export default function StartProposalPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    ApiService.projects.getCategories()
        .then(setCategories)
        .catch(() => toast.error('Could not load categories.'));
  }, []);

  const {
    register,
    handleSubmit,
    control, // Keep control for Controller
    formState: { errors },
  } = useForm<StartFormValues>({
    resolver: zodResolver(startSchema),
  });

  const onSubmit = async (data: StartFormValues) => {
    setIsLoading(true);
    try {
      const newProposal = await ApiService.proposals.create(data);
      toast.success('Draft created! Lets add the details.');

      // Redirect to the edit flow for the next step (hook)
      router.push(`/dashboard/proposals/edit/${newProposal.id}/hook`);
    } catch (error) {
      toast.error('Failed to create draft.');
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
        <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">Start a New Cause</CardTitle>
            <CardDescription>
                Let's begin with a compelling title and the right category. This helps donors find your cause.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Input 
                    label="Project Title"
                    placeholder="e.g., Provide Clean Drinking Water for 100 Families in Rural Lagos"
                    {...register('title')}
                    error={errors.title?.message}
                    disabled={isLoading}
                />
                
                <Controller
                    control={control}
                    name="categoryId"
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Select a primary category..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">Loading categories...</div>
                                    ) : (
                                        categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId.message}</p>}
                        </div>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" className="h-12 rounded-xl" disabled={isLoading || categories.length === 0}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Save & Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}