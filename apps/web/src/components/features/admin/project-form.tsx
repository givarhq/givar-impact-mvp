'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import {
  Loader2, Save, X,
  Image as ImageIcon,
  Briefcase,
  Clock,
  MapPin,
  ShieldCheck,
  ExternalLink,
  LockOpen,
  Fingerprint,
  FileText,
  Send
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
import { Card } from '../../ui/card';

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
        toast.success(status === 'DRAFT' ? 'Draft saved' : 'Project published');
        setIsEditing(false);
      } else {
        await ApiService.admin.createProject(payload);
        toast.success(status === 'DRAFT' ? 'Project saved as draft' : 'Project launched successfully');
        if (status === 'DRAFT') {
          router.push('/admin/projects?tab=drafts');
        } else {
          router.push('/admin/projects?tab=live');
        }
      }
      router.refresh();
    } catch (error) {
      toast.error('Commit failed');
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
    "transition-all duration-300 rounded-3xl h-11 text-sm pr-10",
    readOnly
      ? "bg-muted/10 border-transparent shadow-none cursor-default focus-visible:ring-0 text-foreground font-bold"
      : "bg-background border-border/60 shadow-sm focus-visible:ring-primary/20"
  );

  const getAreaClass = (minHeight: string = "min-h-[180px]") => cn(
    "flex w-full rounded-3xl border px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-300 text-foreground",
    minHeight,
    readOnly
      ? "bg-muted/10 border-transparent shadow-none cursor-default resize-none font-medium"
      : "bg-background border-border/60 focus-visible:border-primary"
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-40 animate-in fade-in duration-300 w-full overflow-hidden">
      {/* Verified origin badge – compact and standalone */}
      {initialData?.proposalId && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 p-2 pl-3 pr-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 w-fit">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest shrink-0">Verified origin:</span>
              <Link href={`/admin/proposals/${initialData.proposalId}`} className="text-xs font-bold underline hover:text-blue-800 flex items-center gap-1 truncate">
                Proposal #{initialData.proposalId.split('-')[0]} <ExternalLink className="h-3 w-3 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Ledger amendment warning */}
      {isAdjustmentMode && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl space-y-4 shadow-sm animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h3 className="text-sm font-bold text-amber-800 tracking-tight">Ledger Amendment Protocol</h3>
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                This project is live. Changes to goal, timeline, or budget require an audit-traceable narrative for donors.
              </p>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-end px-1">
              <label className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Amendment narrative</label>
              <span className={cn(
                "text-[9px] font-bold",
                (reason?.length || 0) < 10 ? "text-destructive" : "text-emerald-600"
              )}>
                {reason?.length || 0} / 10 min
              </span>
            </div>
            <Textarea
              {...register('reasonForGoalAdjustment')}
              placeholder="State the reason for this change..."
              className={cn(
                "min-h-[80px] bg-background border-amber-200 focus-visible:ring-amber-500/20 text-xs rounded-3xl p-4 shadow-inner resize-none",
                (reason?.length || 0) < 10 && (reason?.length || 0) > 0 && "border-destructive/50"
              )}
            />
          </div>
        </div>
      )}

      {/* Project Identity Section */}
      <section className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-8 bg-card rounded-3xl border transition-all duration-300 relative group overflow-hidden",
        readOnly ? "border-border/40 shadow-sm" : "border-primary/30 shadow-md ring-1 ring-primary/5"
      )}>
        <div className="md:col-span-12 flex items-center gap-3 mb-2 min-w-0">
          <div className={cn(
            "h-10 w-10 rounded-3xl flex items-center justify-center transition-all shadow-inner shrink-0",
            readOnly ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}>
            {readOnly ? <ShieldCheck className="h-5 w-5" /> : <LockOpen className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-foreground leading-none">Project Identity</h3>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Core metadata</p>
          </div>
        </div>
        <div className="md:col-span-8 space-y-1 relative min-w-0">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Headline title</label>
          <Input
            {...register('title')}
            className={getInputClass()}
            readOnly={readOnly}
            error={errors.title?.message}
          />
        </div>
        <div className="md:col-span-4 space-y-1 relative min-w-0">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Classification</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                <SelectTrigger className={cn(getInputClass(), "bg-muted/20")}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-3xl shadow-xl border-border/40">
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id} className="rounded-3xl text-xs font-medium py-2.5">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div className="md:col-span-12 space-y-1 relative min-w-0">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Short narrative</label>
          <Textarea
            className={cn(getAreaClass("min-h-[60px]"), "resize-none rounded-3xl")}
            {...register('shortDesc')}
            readOnly={readOnly}
            maxLength={140}
          />
        </div>
        <div className="md:col-span-12 space-y-1 relative min-w-0">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Project description</label>
          <RichTextEditor
            content={description || ''}
            onChange={(val) => setValue('description', val, { shouldDirty: true })}
            readOnly={readOnly}
          />
          {errors.description && <p className="text-[11px] text-destructive mt-1 font-bold">{errors.description.message}</p>}
        </div>
        <div className="md:col-span-6 space-y-1 relative min-w-0">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Geographic location</label>
          <div className="relative group">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 group-focus-within:text-primary transition-colors" />
            <Input
              {...register('location')}
              className={cn(getInputClass(), "pl-10")}
              readOnly={readOnly}
            />
          </div>
        </div>
        <div className="md:col-span-6 space-y-1 relative min-w-0">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Capital goal (NGN)</label>
          <Controller
            control={control}
            name="targetAmount"
            render={({ field }) => (
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-xs">₦</span>
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

      {/* Visual Assets Section */}
      <section className={cn(
        "bg-card p-6 md:p-8 rounded-3xl border shadow-sm space-y-6 transition-all duration-300 relative group overflow-hidden",
        readOnly ? "border-border/40 shadow-sm" : "border-primary/30 shadow-md ring-1 ring-primary/5"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-3xl flex items-center justify-center shadow-inner shrink-0", readOnly ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground leading-none">Visual Assets</h3>
            <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Proof of impact media</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-5 space-y-3 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Primary hero asset</p>
            {coverImage ? (
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/40 shadow-sm group/img bg-muted">
                <img src={coverImage} className="w-full h-full object-cover" alt="Cover" />
                {!readOnly && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                    <Button type="button" variant="destructive" size="sm" className="rounded-3xl h-9 px-5 font-bold text-xs" onClick={() => setValue('coverImage', '')}>
                      <X className="h-3.5 w-3.5 mr-1.5" /> Remove
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <ImageUploader label="Upload Hero Asset" onUploadComplete={(data) => setValue('coverImage', data.previewUrl)} />
            )}
          </div>
          <div className="lg:col-span-7 space-y-3 min-w-0">
            <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Project gallery ({gallery.length}/10)</p>
            <div className={cn(readOnly && "pointer-events-none opacity-90")}>
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

      {/* Budget and Timeline Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card className={cn(
          "p-6 md:p-8 bg-card rounded-3xl border space-y-6 transition-all duration-300 relative group overflow-hidden",
          readOnly ? "border-border/40 shadow-sm" : "border-primary/30 shadow-md"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("h-9 w-9 rounded-3xl flex items-center justify-center shadow-inner shrink-0", readOnly ? "bg-muted" : "bg-primary/10 text-primary")}>
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground leading-none">Budget Ledger</h3>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Procurement plan</p>
            </div>
          </div>
          <BudgetEditor items={budget as any} onChange={(items) => setValue('budgetBreakdown', items as any)} readOnly={readOnly} isLive={isLive} isAdjustmentMode={isAdjustmentMode} />
        </Card>
        <Card className={cn(
          "p-6 md:p-8 bg-card rounded-3xl border space-y-6 transition-all duration-300 relative group overflow-hidden",
          readOnly ? "border-border/40 shadow-sm" : "border-primary/30 shadow-md"
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("h-9 w-9 rounded-3xl flex items-center justify-center shadow-inner shrink-0", readOnly ? "bg-muted" : "bg-primary/10 text-primary")}>
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground leading-none">Execution Roadmap</h3>
              <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tight">Milestone tracking</p>
            </div>
          </div>
          <TimelineEditor items={timeline as any} onChange={(items) => setValue('executionTimeline', items as any)} readOnly={readOnly} isLive={isLive} isAdjustmentMode={isAdjustmentMode} />
        </Card>
      </div>

      {/* Persistent sticky action bar – always visible, content adapts to current mode */}
      <div className="fixed md:bottom-0 bottom-14 left-0 md:left-[260px] right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border/40 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left side: Cancel / Discard changes (shown only when creating or editing) */}
          <div>
            {(isEditing || !initialData) && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="rounded-3xl h-10 px-6 font-bold text-muted-foreground hover:text-foreground text-xs w-full sm:w-auto"
              >
                {initialData ? 'Discard changes' : 'Cancel'}
              </Button>
            )}
          </div>

          {/* Right side: Primary actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Draft + Publish/Launch buttons (shown when creating new or editing existing) */}
            {(isEditing || !initialData) && (
              <>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit((d) => onSubmit(d, 'DRAFT'))}
                  variant="secondary"
                  className="flex-1 sm:flex-none rounded-3xl h-10 px-5 font-bold text-xs border border-border/40 shadow-none bg-muted/40"
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <FileText className="mr-1.5 h-3.5 w-3.5" />}
                  Draft
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting || (isAdjustmentMode && (!reason || reason.length < 10))}
                  onClick={handleSubmit((d) => onSubmit(d, 'ACTIVE'))}
                  className="flex-[2] sm:flex-none rounded-3xl h-10 px-8 font-bold text-xs shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <div className="flex items-center gap-2">
                      {initialData ? <Save className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                      {initialData ? 'Publish Updates' : 'Launch Project'}
                    </div>
                  )}
                </Button>
              </>
            )}

            {/* Unlock for editing button (shown only when viewing existing project in read-only mode) */}
            {initialData && !isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={handleStartEditing}
                className="rounded-3xl h-10 px-6 font-bold gap-2 text-xs border-border/60 text-primary hover:bg-muted shadow-sm"
              >
                <LockOpen className="h-3.5 w-3.5" />
                Unlock for editing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}