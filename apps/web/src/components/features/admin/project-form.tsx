'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import {
  Loader2, Save, X, Layout,
  Image as ImageIcon,
  Briefcase,
  Clock,
  MapPin,
  ShieldCheck,
  ExternalLink,
  Unlock,
  Send,
  LockOpen,
  Fingerprint,
  FileText
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { RichTextEditor } from '../../ui/rich-text-editor';
import { ApiService } from '../../../services/api';
import { BudgetEditor } from '../proposals/budget-editor';
import { TimelineEditor } from '../proposals/timeline-editor';
import { MediaManager, ImageUploader } from '../proposals/media-uploader';
import { formatNumberInput, parseFormattedNumber } from '../../../lib/utils/format';
import { cn } from '../../../lib/utils/cn';
import { Textarea } from '../../ui/textarea';

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
  description: z.string().min(10, "Description is too short"),
  shortDesc: z.string().optional(),
  categoryId: z.string().uuid("Category is required"),
  location: z.string().min(2, "Location is required"),
  targetAmount: z.number().min(100, "Min 100"),
  currency: z.enum(['NGN', 'USD', 'GBP']),
  coverImage: z.string().url("Cover image required"),
  gallery: z.array(mediaItemSchema),
  budgetBreakdown: z.array(budgetItemSchema),
  executionTimeline: z.array(timelineItemSchema),
  reasonForGoalAdjustment: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: any;
  categories: any[];
}

export function AdminProjectForm({ initialData, categories }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const isLive = initialData?.status === 'ACTIVE' || initialData?.status === 'FUNDED' || initialData?.status === 'COMPLETED';
  const readOnly = initialData ? !isEditing : false;
  const isAdjustmentMode = isLive && isEditing;

  const { register, control, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData ? {
      ...initialData,
      coverImage: initialData.imageUrl || '',
      gallery: initialData.gallery || [],
      budgetBreakdown: initialData.budgetBreakdown || [],
      executionTimeline: initialData.executionTimeline || [],
      targetAmount: initialData.targetAmount ? Number(initialData.targetAmount) / 100 : undefined,
      reasonForGoalAdjustment: '',
    } : {
      currency: 'NGN',
      gallery: [],
      budgetBreakdown: [],
      executionTimeline: [],
    }
  });

  const [gallery, budget, timeline, coverImage, reason, description] = watch([
    'gallery',
    'budgetBreakdown',
    'executionTimeline',
    'coverImage',
    'reasonForGoalAdjustment',
    'description'
  ]);

  const onSubmit = async (data: ProjectFormValues, status: 'DRAFT' | 'ACTIVE') => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, targetAmount: data.targetAmount * 100, status };

      if (initialData) {
        await ApiService.admin.updateProject(initialData.id, payload);
        toast.success(status === 'DRAFT' ? 'Draft Saved' : 'Project Published');
        setIsEditing(false);
      } else {
        await ApiService.admin.createProject(payload);
        toast.success(status === 'DRAFT' ? 'Project Saved as Draft' : 'Project Launched Successfully');
        if (status === 'DRAFT') {
          router.push('/admin/projects?tab=drafts');
        } else {
          router.push('/admin/projects?tab=live');
        }
      }
      router.refresh();
    } catch (error) {
      toast.error('Failed to commit changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      reset();
      setIsEditing(false);
    }
  };

  const handleStartEditing = () => {
    const scrollPosition = window.scrollY;
    setIsEditing(true);
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPosition);
    });
  };

  const getInputClass = () => cn(
    "transition-all duration-300 rounded-xl h-11 text-sm pr-10",
    readOnly
      ? "bg-muted/10 border-transparent shadow-none cursor-default focus-visible:ring-0 text-foreground font-medium"
      : "bg-background border-border shadow-sm focus-visible:ring-primary/20"
  );

  const getAreaClass = (minHeight: string = "min-h-[180px]") => cn(
    "flex w-full rounded-xl border px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-300 text-foreground",
    minHeight,
    readOnly
      ? "bg-muted/10 border-transparent shadow-none cursor-default resize-none font-medium"
      : "bg-background border-input focus-visible:border-primary"
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {initialData?.proposalId && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 w-fit">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Verified Origin:</span>
              <Link href={`/admin/proposals/${initialData.proposalId}`} className="text-xs font-bold underline hover:text-blue-800 flex items-center gap-1">
                Proposal #{initialData.proposalId.split('-')[0]} <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {initialData && (
          <Button
            type="button"
            variant={isEditing ? "ghost" : "outline"}
            onClick={() => isEditing ? handleCancel() : handleStartEditing()}
            className={cn(
              "h-11 rounded-xl px-6 font-bold transition-all gap-2",
              isEditing ? "text-muted-foreground" : "border-primary/30 text-primary hover:bg-primary/5 shadow-sm"
            )}
          >
            {isEditing ? <X className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
            {isEditing ? 'Cancel Editing' : 'Unlock for Editing'}
          </Button>
        )}
      </div>

      {isAdjustmentMode && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[32px] space-y-4 shadow-xl shadow-amber-500/5 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-[18px] bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-amber-800 uppercase tracking-tight">Ledger Amendment Protocol</h3>
              <p className="text-xs text-amber-700/80 leading-relaxed font-medium max-w-2xl">
                This project is live. Any modifications to the goal, timeline, or budget require an audit-traceable narrative that will be published to all donors for transparency.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-end px-1">
              <label className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">Amendment Narrative (Required)</label>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tighter",
                (reason?.length || 0) < 10 ? "text-destructive" : "text-emerald-600"
              )}>
                {reason?.length || 0} / 10 characters minimum
              </span>
            </div>
            <Textarea
              {...register('reasonForGoalAdjustment')}
              placeholder="State the reason for this change (e.g., inflation spikes, vendor availability)..."
              className={cn(
                "min-h-[100px] bg-white border-amber-200 focus-visible:ring-amber-500/20 text-sm rounded-2xl p-4 shadow-inner",
                (reason?.length || 0) < 10 && (reason?.length || 0) > 0 && "border-destructive/50"
              )}
            />
          </div>
        </div>
      )}

      <section className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-6 p-8 bg-card rounded-[32px] border transition-all duration-500 relative group",
        readOnly ? "border-border shadow-sm" : "border-primary/30 shadow-2xl ring-1 ring-primary/5"
      )}>
        <div className="md:col-span-12 flex items-center gap-3 mb-4">
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
            readOnly ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}>
            {readOnly ? <ShieldCheck className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground leading-none">Project Identity</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Core forensic data</p>
          </div>
        </div>

        <div className="md:col-span-8 space-y-1.5 relative">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Headline Title</label>
          <Input
            {...register('title')}
            className={getInputClass()}
            readOnly={readOnly}
            error={errors.title?.message}
          />
        </div>

        <div className="md:col-span-4 space-y-1.5 relative">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Classification</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                <SelectTrigger className={cn(getInputClass(), "bg-background/50")}><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl border-border/50">
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id} className="rounded-lg">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="md:col-span-12 space-y-1.5 relative">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Short Narrative</label>
          <Textarea
            className={cn(getAreaClass("min-h-[10px]"), "resize-none")}
            {...register('shortDesc')}
            readOnly={readOnly}
            maxLength={140}
          />
        </div>

        <div className="md:col-span-12 space-y-1.5 relative">
          <RichTextEditor
            label="Detailed Project Description"
            content={description || ''}
            onChange={(val) => setValue('description', val, { shouldDirty: true })}
            readOnly={readOnly}
          />
          {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
        </div>

        <div className="md:col-span-6 space-y-1.5 relative">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Geographic Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <Input
              {...register('location')}
              className={cn(getInputClass(), "pl-9")}
              readOnly={readOnly}
            />
          </div>
        </div>

        <div className="md:col-span-6 space-y-1.5 relative">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Capital Goal (NGN)</label>
          <Controller
            control={control}
            name="targetAmount"
            render={({ field }) => (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">₦</span>
                <Input
                  value={formatNumberInput(String(field.value || ''))}
                  onChange={(e) => field.onChange(Number(parseFormattedNumber(e.target.value)))}
                  className={cn(getInputClass(), "pl-10 font-bold tabular-nums")}
                  readOnly={readOnly}
                />
              </div>
            )}
          />
        </div>
      </section>

      <section className={cn(
        "bg-card p-8 rounded-[32px] border shadow-sm space-y-8 transition-all duration-500 relative group",
        readOnly ? "border-border shadow-sm" : "border-primary/30 shadow-2xl ring-1 ring-primary/5"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner", readOnly ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground leading-none">Visual Assets</h3>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Proof of impact media</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Primary Display Asset</p>
            {coverImage ? (
              <div className="relative aspect-video rounded-[24px] overflow-hidden border border-border shadow-2xl group/img">
                <img src={coverImage} className="object-cover w-full h-full" alt="Cover" />
                {!readOnly && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                    <Button type="button" variant="destructive" size="sm" className="rounded-xl h-10 px-6 font-bold shadow-lg" onClick={() => setValue('coverImage', '')}>
                      <X className="h-4 w-4 mr-2" /> Remove Image
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <ImageUploader label="Upload Hero Asset" onUploadComplete={(data) => setValue('coverImage', data.previewUrl)} />
            )}
          </div>

          <div className="lg:col-span-7 space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Evidence Gallery ({gallery.length}/10)</p>
            <div className={cn(readOnly && "pointer-events-none opacity-95")}>
              <MediaManager
                items={gallery as any}
                onAdd={(item) => !readOnly && setValue('gallery', [...gallery, item])}
                onRemove={(id) => !readOnly && setValue('gallery', gallery.filter((i) => i.id !== id))}
                onUpdate={(id, updates) => !readOnly && setValue('gallery', gallery.map((i) => i.id === id ? { ...i, ...updates } : i))}
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground px-2 uppercase tracking-widest">
          Planning & Accountability
        </p>
        <p className="text-sm text-muted-foreground px-2 leading-relaxed max-w-4xl">
          Define the project&apos;s financial requirements and implementation schedule. The <strong>Budget Ledger</strong> identifies procurement needs, while the <strong>Execution Roadmap</strong> establishes the verifiable milestones required for donor transparency and treasury release.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className={cn(
            "p-8 bg-card rounded-[32px] border space-y-6 transition-all duration-500 relative group",
            readOnly ? "border-border shadow-sm" : "border-primary/30 shadow-2xl ring-1 ring-primary/5"
          )}>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner", readOnly ? "bg-muted" : "bg-primary/10 text-primary")}>
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground leading-none">Budget Ledger</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Vendor procurement plan</p>
              </div>
            </div>
            <BudgetEditor items={budget as any} onChange={(items) => setValue('budgetBreakdown', items as any)} readOnly={readOnly} isLive={isLive} isAdjustmentMode={isAdjustmentMode} />
          </div>

          <div className={cn(
            "p-8 bg-card rounded-[32px] border space-y-6 transition-all duration-500 relative group",
            readOnly ? "border-border shadow-sm" : "border-primary/30 shadow-2xl ring-1 ring-primary/5"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner", readOnly ? "bg-muted" : "bg-primary/10 text-primary")}>
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground leading-none">Execution Roadmap</h3>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Milestone tracking</p>
              </div>
            </div>
            <TimelineEditor items={timeline as any} onChange={(items) => setValue('executionTimeline', items as any)} readOnly={readOnly} isLive={isLive} isAdjustmentMode={isAdjustmentMode} />
          </div>
        </div>
      </section>

      {(!initialData || isEditing) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-50 md:pl-[300px] animate-in slide-in-from-bottom-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleCancel}
              className="rounded-xl h-12 px-6 font-bold text-muted-foreground hover:text-foreground"
            >
              {initialData ? 'Discard Changes' : 'Cancel'}
            </Button>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit((d) => onSubmit(d, 'DRAFT'))}
                variant="secondary"
                className="rounded-xl h-12 px-8 font-bold text-sm border border-border/50 shadow-sm min-w-[140px]"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText className="mr-2 h-4 w-4" />}
                Save Draft
              </Button>
              <Button
                type="button"
                disabled={isSubmitting || (isAdjustmentMode && (!reason || reason.length < 10))}
                onClick={handleSubmit((d) => onSubmit(d, 'ACTIVE'))}
                className="rounded-xl h-12 px-8 font-black text-sm shadow-xl shadow-primary/20 active:scale-95 transition-all min-w-[180px]"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  <div className="flex items-center gap-2">
                    {initialData ? <Save className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    {initialData ? 'Publish Updates' : 'Launch Project'}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}