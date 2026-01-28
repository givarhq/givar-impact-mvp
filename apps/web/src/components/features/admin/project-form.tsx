'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { 
  Loader2, Save, X, Layout, 
  Image as ImageIcon, 
  Briefcase, 
  Clock, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';
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
  key: z.string().optional(),
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
  targetAmount: z.number().min(100, "Min 100"),
  currency: z.enum(['NGN', 'USD', 'GBP']),
  coverImage: z.string().url("Cover image required"),
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
  
  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData ? {
      ...initialData,
      gallery: initialData.gallery || [],
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
      const payload = {
          ...data,
          targetAmount: data.targetAmount * 100 
      };
      
      if (initialData) {
        await ApiService.admin.updateProject(initialData.id, payload);
        toast.success('Project updated');
      } else {
        await ApiService.admin.createProject(payload);
        toast.success('Project created');
      }
      router.push('/admin/projects');
      router.refresh();
    } catch (error) {
      toast.error('Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* --- Section 1: Project Identity --- */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-card p-6 rounded-[24px] border border-border shadow-sm">
          <div className="md:col-span-12 flex items-center gap-2 mb-2">
             <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Layout className="h-4 w-4" />
             </div>
             <h3 className="font-bold text-sm text-foreground/80">Project identity</h3>
          </div>
          
          <div className="md:col-span-8 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Headline title</label>
              <Input {...register('title')} placeholder="e.g. Clean Water Initiative" className="h-11 text-sm rounded-xl" error={errors.title?.message} />
          </div>
          
          <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Category</label>
              <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="rounded-xl h-11 text-sm bg-background/50"><SelectValue placeholder="Select category" /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                              {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                      </Select>
                  )}
              />
          </div>

          <div className="md:col-span-12 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Short summary (visible on cards)</label>
              <textarea 
                  className="flex w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[70px] resize-none"
                  {...register('shortDesc')}
                  placeholder="Summarize the impact in 140 characters..."
                  maxLength={140}
              />
          </div>

          <div className="md:col-span-12 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Full narrative & solution</label>
              <textarea 
                  className="flex w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 min-h-[180px]"
                  {...register('description')}
                  placeholder="Deep dive into the problem and your proposed solution..."
              />
          </div>
          
          <div className="md:col-span-6 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Physical location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input {...register('location')} placeholder="City, Country" className="pl-9 h-11 text-sm rounded-xl bg-background/50" />
              </div>
          </div>
          
          <div className="md:col-span-6 space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground ml-1">Funding goal (NGN)</label>
              <Controller
                  control={control}
                  name="targetAmount"
                  render={({ field }) => (
                      <Input 
                        value={formatNumberInput(String(field.value || ''))}
                        onChange={(e) => field.onChange(Number(parseFormattedNumber(e.target.value)))}
                        placeholder="0.00"
                        className="h-11 text-sm font-bold rounded-xl bg-background/50 tabular-nums"
                      />
                  )}
              />
          </div>
      </section>

      {/* --- Section 2: Visual Assets --- */}
      <section className="bg-card p-6 rounded-[24px] border border-border shadow-sm space-y-6">
          <div className="flex items-center gap-2">
             <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ImageIcon className="h-4 w-4" />
             </div>
             <h3 className="font-bold text-sm text-foreground/80">Media portfolio</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Primary cover</p>
                  {coverImage ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border border-border shadow-inner group">
                          <img src={coverImage} className="object-cover w-full h-full" alt="Cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button type="button" variant="destructive" size="sm" className="rounded-xl h-8 text-xs" onClick={() => setValue('coverImage', '')}>
                                <X className="h-3 w-3 mr-1" /> Remove
                            </Button>
                          </div>
                      </div>
                  ) : (
                      <ImageUploader label="Upload hero image" onUploadComplete={(data) => setValue('coverImage', data.previewUrl)} />
                  )}
              </div>
              
              <div className="lg:col-span-7 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Supporting gallery ({gallery.length}/10)</p>
                  <MediaManager 
                      items={gallery as any}
                      onAdd={(item) => setValue('gallery', [...gallery, item])}
                      onRemove={(id) => setValue('gallery', gallery.filter((i) => i.id !== id))}
                      onUpdate={(id, updates) => setValue('gallery', gallery.map((i) => i.id === id ? { ...i, ...updates } : i))}
                  />
              </div>
          </div>
      </section>

      {/* --- Section 3: Strategic Plan --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-card rounded-[24px] border border-border space-y-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Briefcase className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground/80">Budget ledger</h3>
              </div>
              <BudgetEditor items={budget as any} onChange={(items) => setValue('budgetBreakdown', items as any)} />
          </div>
          
          <div className="p-6 bg-card rounded-[24px] border border-border space-y-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Clock className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-sm text-foreground/80">Execution map</h3>
              </div>
              <TimelineEditor items={timeline as any} onChange={(items) => setValue('executionTimeline', items as any)} />
          </div>
      </div>

      {/* --- Footer Actions --- */}
      <div className="flex items-center justify-end gap-4 pt-6 border-border">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => router.back()} 
            className="rounded-xl h-12 px-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
              Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="rounded-xl h-12 px-10 font-bold text-sm shadow-lg shadow-primary/20 active:scale-95 transition-all min-w-[180px]"
          >
              {isSubmitting ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              {initialData ? 'Update project' : 'Create project'}
          </Button>
      </div>

    </form>
  );
}