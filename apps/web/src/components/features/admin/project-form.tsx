'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { ApiService } from '../../../services/api';
import { BudgetEditor } from '../proposals/budget-editor';
import { TimelineEditor } from '../proposals/timeline-editor';
import { MediaManager, ImageUploader } from '../proposals/media-uploader';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';

const mediaItemSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  key: z.string(),
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']),
  caption: z.string().optional().or(z.literal('')),
});

const budgetItemSchema = z.object({
  id: z.string(),
  item: z.string(),
  cost: z.number().min(0),
  vendor: z.string(),
  type: z.enum(['SERVICE', 'GOODS', 'LOGISTICS', 'OTHER']),
  vendorContact: z.string().optional(),
});

const timelineItemSchema = z.object({
  id: z.string(),
  phase: z.string(),
  estimatedDate: z.string(),
  deliverables: z.string(),
});

const projectSchema = z.object({
  title: z.string().min(5, "Title is too short"),
  description: z.string().min(20, "Description is too short"),
  shortDesc: z.string().optional(),
  categoryId: z.string().uuid("Category is required"),
  location: z.string().min(2, "Location is required"),
  targetAmount: z.number().min(100, "Target amount must be at least 100"),
  currency: z.enum(['NGN', 'USD', 'GBP']),
  coverImage: z.string().url("Cover image is required"),
  
  gallery: z.array(mediaItemSchema),
  budgetBreakdown: z.array(budgetItemSchema),
  executionTimeline: z.array(timelineItemSchema),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: any;
  categories: any[];
}

export function AdminProjectForm({ initialData, categories }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { 
    register, 
    control, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors } 
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData ? {
      ...initialData,
      gallery: (initialData.gallery || []).map((item: any) => ({
          ...item,
          key: item.key || item.url
      })),
      budgetBreakdown: initialData.budgetBreakdown || [],
      executionTimeline: initialData.executionTimeline || [],
      targetAmount: initialData.targetAmount ? Number(initialData.targetAmount) / 100 : undefined
    } : {
      currency: 'NGN',
      gallery: [],
      budgetBreakdown: [],
      executionTimeline: [],
    }
  });

  const gallery = watch('gallery');
  const budget = watch('budgetBreakdown');
  const timeline = watch('executionTimeline');
  const coverImage = watch('coverImage');

  const onSubmit = async (data: ProjectFormValues) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        await ApiService.admin.updateProject(initialData.id, data);
        toast.success('Project updated successfully');
      } else {
        await ApiService.admin.createProject(data);
        toast.success('Project created successfully');
      }
      router.push('/admin/projects');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Operation failed. Check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-20">
      
      {/* 1. Core Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-card rounded-2xl border border-border">
          <h3 className="col-span-full font-bold text-lg">Core Details</h3>
          
          <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input 
                {...register('title')} 
                placeholder="Project Title" 
                error={errors.title?.message as string} 
              />
          </div>
          
          <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Select..." /></SelectTrigger>
                          <SelectContent>
                              {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  )}
              />
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
          </div>

          <div className="col-span-full space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea 
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary min-h-[120px]"
                  {...register('description')}
                  placeholder="Full project story..."
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          
          <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input {...register('location')} placeholder="Lagos, Nigeria" error={errors.location?.message} />
          </div>
          
          <div className="space-y-2">
              <label className="text-sm font-medium">Target Amount (NGN)</label>
              <Controller
                  control={control}
                  name="targetAmount"
                  render={({ field }) => (
                      <Input 
                        value={formatNumberInput(String(field.value || ''))}
                        onChange={(e) => field.onChange(Number(parseFormattedNumber(e.target.value)))}
                        placeholder="5,000,000"
                        error={errors.targetAmount?.message}
                      />
                  )}
              />
          </div>
      </div>

      {/* 2. Media */}
      <div className="p-6 bg-card rounded-2xl border border-border space-y-6">
          <h3 className="font-bold text-lg">Media Assets</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                  <label className="text-sm font-medium">Cover Image</label>
                  {coverImage ? (
                      <div className="relative aspect-video rounded-xl overflow-hidden border">
                          <img src={coverImage} className="object-cover w-full h-full" alt="Cover" />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm" 
                            className="absolute top-2 right-2"
                            onClick={() => setValue('coverImage', '')}
                          >Remove</Button>
                      </div>
                  ) : (
                      <ImageUploader 
                          label="Upload Cover" 
                          onUploadComplete={(data) => setValue('coverImage', data.previewUrl)} 
                      />
                  )}
                   {errors.coverImage && <p className="text-xs text-destructive">{errors.coverImage.message}</p>}
              </div>
              
              <div className="space-y-2">
                  <label className="text-sm font-medium">Gallery</label>
                  <MediaManager 
                      items={gallery}
                      onAdd={(item) => setValue('gallery', [...gallery, item])}
                      onRemove={(id) => setValue('gallery', gallery.filter((i) => i.id !== id))}
                      onUpdate={(id, updates) => setValue('gallery', gallery.map((i) => i.id === id ? { ...i, ...updates } : i))}
                  />
              </div>
          </div>
      </div>

      {/* 3. Execution Plan */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
              <h3 className="font-bold text-lg">Budget</h3>
              <BudgetEditor 
                  items={budget}
                  onChange={(items) => setValue('budgetBreakdown', items)}
              />
          </div>
          
          <div className="p-6 bg-card rounded-2xl border border-border space-y-4">
              <h3 className="font-bold text-lg">Timeline</h3>
              <TimelineEditor 
                  items={timeline}
                  onChange={(items) => setValue('executionTimeline', items)}
              />
          </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-40 md:pl-[280px]">
          <div className="max-w-7xl mx-auto flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl h-12 px-6">
                  Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-8 font-bold text-base shadow-xl shadow-primary/20">
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
                  {initialData ? 'Update Project' : 'Create Project'}
              </Button>
          </div>
      </div>

    </form>
  );
}