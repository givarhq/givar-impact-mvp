'use client';

import React, { useState, memo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import {
  Loader2,
  Save,
  X,
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
import { motion, AnimatePresence } from 'framer-motion';

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
  title: z.string().min(5, "The title is a bit too short"),
  description: z.string().min(10, "Please provide a more detailed description"),
  shortDesc: z.string().optional(),
  categoryId: z.string().uuid("Please select a category"),
  location: z.string().min(2, "A location is required"),
  targetAmount: z.number().min(100, "Minimum goal amount is 100"),
  currency: z.enum(['NGN', 'USD', 'GBP']),
  coverImage: z.string().min(1, "A primary image is required"),
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

export const AdminProjectForm = memo(function AdminProjectForm({ initialData, categories }: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.imageUrl || null);

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
    const toastId = toast.loading(status === 'DRAFT' ? "Saving your progress..." : "Publishing cause...");
    try {
      const payload = { ...data, targetAmount: data.targetAmount * 100, status };
      if (initialData) {
        await ApiService.admin.updateProject(initialData.id, payload);
        toast.success(status === 'DRAFT' ? 'Changes saved as draft' : 'Project successfully published', { id: toastId });
        setIsEditing(false);
      } else {
        await ApiService.admin.createProject(payload);
        toast.success(status === 'DRAFT' ? 'New cause saved as draft' : 'New cause launched successfully', { id: toastId });
        router.push(status === 'DRAFT' ? '/admin/projects?tab=drafts' : '/admin/projects?tab=live');
      }
      router.refresh();
    } catch (error) {
      toast.error('We could not save these changes', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (initialData) {
      reset();
      setCoverPreview(initialData.imageUrl || null);
      setIsEditing(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const getInputClass = () => cn(
    "transition-all duration-300 rounded-3xl h-12 text-sm pr-10",
    readOnly
      ? "bg-muted/10 border-transparent shadow-none cursor-default focus-visible:ring-0 text-foreground font-bold"
      : "bg-background border-border/60 shadow-inner focus:bg-white focus-visible:ring-primary/10"
  );

  const getAreaClass = (minHeight: string = "min-h-[180px]") => cn(
    "flex w-full rounded-3xl border px-5 py-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/10 transition-all duration-300 text-foreground font-medium",
    minHeight,
    readOnly
      ? "bg-muted/10 border-transparent shadow-none cursor-default resize-none opacity-80"
      : "bg-background border-border/60 shadow-inner focus:border-primary"
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-40 animate-in fade-in duration-500 w-full overflow-hidden">

      {initialData?.proposalId && (
        <div className="flex animate-in slide-in-from-left-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary/5 border border-primary/20 text-primary shadow-sm">
            <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest">Verified Origin:</span>
              <Link href={`/admin/proposals/${initialData.proposalId}`} className="text-xs font-black underline hover:text-primary/80 flex items-center gap-1.5 transition-colors">
                Proposal #{initialData.proposalId.split('-')[0]} <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isAdjustmentMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-50 border border-amber-200 p-6 rounded-3xl space-y-5 shadow-sm overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 shadow-inner">
                <Fingerprint className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-amber-900 tracking-tight">Ledger Amendment Protocol</h3>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  You are editing a live project. Any changes to the financial goal, budget, or roadmap require a brief explanation for our donors.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-amber-800 tracking-widest">Amendment Narrative</label>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  (reason?.length || 0) < 10 ? "text-destructive bg-destructive/5" : "text-emerald-600 bg-emerald-50"
                )}>
                  {reason?.length || 0} / 10 Characters Minimum
                </span>
              </div>
              <Textarea
                {...register('reasonForGoalAdjustment')}
                placeholder="Please describe why this change is necessary..."
                className="min-h-[100px] bg-white border-amber-200 focus-visible:ring-amber-500/20 text-sm rounded-2xl p-5 shadow-inner resize-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identity Section */}
      <section className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-10 bg-card rounded-3xl border transition-all duration-500 relative group overflow-hidden shadow-sm",
        readOnly ? "border-border/40" : "border-primary/30 ring-4 ring-primary/5"
      )}>
        <div className="md:col-span-12 flex items-center gap-4 mb-4">
          <div className={cn(
            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-inner shrink-0",
            readOnly ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/20"
          )}>
            {readOnly ? <ShieldCheck className="h-6 w-6" /> : <LockOpen className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-foreground leading-none">Project Identity</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1.5 tracking-tight">Essential project metadata & classification</p>
          </div>
        </div>

        <div className="md:col-span-8 space-y-1.5">
          <label className="text-[11px] font-black text-muted-foreground tracking-widest ml-1">Cause Headline</label>
          {readOnly ? (
            <div
              className="h-12 flex items-center px-5 rounded-3xl 
               bg-muted/10 text-foreground font-bold text-sm
               border-transparent shadow-none
               truncate"
              title={watch('title')}
            >
              {watch('title')}
            </div>
          ) : (
            <Input
              {...register('title')}
              className={getInputClass()}
              placeholder="Enter A Compelling Title..."
              error={errors.title?.message}
            />
          )}
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[11px] font-black text-muted-foreground tracking-widest ml-1">Sector Classification</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={readOnly}>
                <SelectTrigger className={cn(getInputClass(), "bg-muted/10")}>
                  <SelectValue placeholder="Select A Sector" />
                </SelectTrigger>
                <SelectContent className="rounded-3xl shadow-2xl border-border/40 p-2">
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-2xl text-xs font-bold py-3">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="md:col-span-12 space-y-1.5">
          <label className="text-[11px] font-black text-muted-foreground tracking-widest ml-1">Short Elevator Pitch</label>
          <Textarea
            className={cn(getAreaClass("min-h-[80px]"), "resize-none rounded-3xl")}
            {...register('shortDesc')}
            readOnly={readOnly}
            placeholder="A brief summary for donor lists..."
            maxLength={140}
          />
        </div>

        <div className="md:col-span-12 space-y-1.5">
          <label className="text-[11px] font-black text-muted-foreground tracking-widest ml-1">Project Mission Narrative</label>
          <RichTextEditor
            content={description || ''}
            onChange={(val) => setValue('description', val, { shouldDirty: true })}
            readOnly={readOnly}
          />
          {errors.description && <p className="text-xs text-destructive mt-2 font-bold px-2">{errors.description.message}</p>}
        </div>

        <div className="md:col-span-6 space-y-1.5">
          <label className="text-[11px] font-black text-muted-foreground tracking-widest ml-1">Primary Location</label>
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              {...register('location')}
              placeholder="e.g. Lagos, Nigeria"
              className={cn(getInputClass(), "pl-11")}
              readOnly={readOnly}
            />
          </div>
        </div>

        <div className="md:col-span-6 space-y-1.5">
          <label className="text-[11px] font-black text-muted-foreground tracking-widest ml-1">Capital Funding Goal (NGN)</label>
          <Controller
            control={control}
            name="targetAmount"
            render={({ field }) => (
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm">₦</span>
                <Input
                  value={formatNumberInput(String(field.value || ''))}
                  onChange={(e) => field.onChange(Number(parseFormattedNumber(e.target.value)))}
                  className={cn(getInputClass(), "pl-11 font-black tabular-nums text-lg")}
                  placeholder="0.00"
                  readOnly={readOnly}
                />
              </div>
            )}
          />
        </div>
      </section>

      {/* Visual Assets Section */}
      <section className={cn(
        "bg-card p-6 md:p-10 rounded-3xl border shadow-sm space-y-8 transition-all duration-500 relative group overflow-hidden",
        readOnly ? "border-border/40" : "border-primary/30 ring-4 ring-primary/5"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0", readOnly ? "bg-muted" : "bg-primary/10 text-primary border border-primary/20")}>
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-foreground leading-none">Visual Assets</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1.5 tracking-tight">Photos & documents for proof of impact</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-3">
            <p className="text-[11px] font-black text-muted-foreground tracking-widest ml-1">Primary Showcase Image</p>
            {coverPreview || coverImage ? (
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/40 shadow-md group/img bg-muted">
                <Image
                  src={coverPreview || coverImage}
                  alt="Project Hero"
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover transition-transform duration-700 group-hover/img:scale-105"
                />
                {!readOnly && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                    <Button type="button" variant="destructive" size="sm" className="rounded-3xl h-10 px-6 font-bold text-xs shadow-xl active:scale-95" onClick={() => {
                      setValue('coverImage', '', { shouldDirty: true });
                      setCoverPreview(null);
                    }}>
                      <X className="h-4 w-4 mr-2" /> Remove Image
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-56">
                <ImageUploader label="Upload image" onUploadComplete={(data) => {
                  setValue('coverImage', data.key, { shouldDirty: true });
                  setCoverPreview(data.previewUrl);
                }} />
              </div>
            )}
            {errors.coverImage && <p className="text-[11px] font-bold text-destructive px-2 mt-1">{errors.coverImage.message}</p>}
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex justify-between items-center px-1">
              <p className="text-[11px] font-black text-muted-foreground tracking-widest">Supporting Gallery ({gallery.length}/10)</p>
            </div>
            <div className={cn("transition-opacity duration-500", readOnly && "pointer-events-none opacity-90")}>
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

      {/* Financial & Strategic Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <Card className={cn(
          "p-6 md:p-10 bg-card rounded-3xl border space-y-8 transition-all duration-500 relative group overflow-hidden shadow-sm",
          readOnly ? "border-border/40" : "border-primary/30 shadow-lg"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shadow-inner shrink-0", readOnly ? "bg-muted" : "bg-primary/10 text-primary border border-primary/20")}>
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground leading-none">Financial Ledger</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1.5 tracking-tight">Detailed procurement & budget items</p>
            </div>
          </div>
          <BudgetEditor items={budget as any} onChange={(items) => setValue('budgetBreakdown', items as any)} readOnly={readOnly} isLive={isLive} isAdjustmentMode={isAdjustmentMode} />
        </Card>

        <Card className={cn(
          "p-6 md:p-10 bg-card rounded-3xl border space-y-8 transition-all duration-500 relative group overflow-hidden shadow-sm",
          readOnly ? "border-border/40" : "border-primary/30 shadow-lg"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shadow-inner shrink-0", readOnly ? "bg-muted" : "bg-primary/10 text-primary border border-primary/20")}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground leading-none">Execution Roadmap</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1.5 tracking-tight">Key milestones & delivery schedule</p>
            </div>
          </div>
          <TimelineEditor items={timeline as any} onChange={(items) => setValue('executionTimeline', items as any)} readOnly={readOnly} isLive={isLive} isAdjustmentMode={isAdjustmentMode} />
        </Card>
      </div>

      {/* Control Terminal Bar */}
      <div className="fixed md:bottom-0 bottom-14 left-0 md:left-[260px] right-0 p-5 bg-background/90 backdrop-blur-2xl border-t border-border/40 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {(isEditing || !initialData) && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                className="rounded-3xl h-12 px-8 font-bold text-muted-foreground hover:text-foreground text-xs w-full sm:w-auto transition-all"
              >
                {initialData ? 'Discard Changes' : 'Cancel Setup'}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
            {(isEditing || !initialData) && (
              <>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit((d) => onSubmit(d, 'DRAFT'))}
                  variant="secondary"
                  className="flex-1 min-w-0 rounded-3xl h-11 px-4 font-bold text-[11px]
               border border-border/60 bg-muted/40 shadow-none 
               hover:bg-muted truncate"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <div className="flex items-center justify-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="truncate">Save Draft</span>
                    </div>
                  )}
                </Button>

                <Button
                  type="button"
                  disabled={isSubmitting || (isAdjustmentMode && (!reason || reason.length < 10))}
                  onClick={handleSubmit((d) => onSubmit(d, 'ACTIVE'))}
                  className="flex-1 min-w-0 rounded-3xl h-11 px-4 font-bold text-[11px]
               shadow-xl shadow-primary/30 active:scale-[0.98] 
               transition-all bg-primary text-white border-0 truncate"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <div className="flex items-center justify-center gap-2 min-w-0">
                      {initialData ? (
                        <Save className="h-4 w-4 shrink-0" />
                      ) : (
                        <Send className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">
                        {initialData ? 'Publish Updates' : 'Launch Project'}
                      </span>
                    </div>
                  )}
                </Button>
              </>
            )}

            {initialData && !isEditing && (
              <div className="w-full flex justify-center sm:justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStartEditing}
                  className="rounded-3xl h-11 px-8 font-bold gap-3 text-xs 
                 border-border/60 text-primary hover:bg-muted 
                 shadow-lg bg-background transition-all active:scale-[0.98]"
                >
                  <LockOpen className="h-4 w-4" />
                  Unlock For Modification
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});