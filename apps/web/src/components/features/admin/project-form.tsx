'use client';

import { useState, useMemo } from 'react';
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
  Edit2,
  Unlock,
  ShieldCheck,
  FileText,
  Send,
  ExternalLink,
  Lock,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
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
  const [unlockedSections, setUnlockedSections] = useState<Record<string, boolean>>({});
  const [isAdjustmentMode, setIsAdjustmentMode] = useState(false);

  const isSectionReadOnly = (section: string) => initialData ? !unlockedSections[section] : false;
  const showFooter = !initialData || Object.values(unlockedSections).some(v => v === true);

  // Financial integrity check
  const isLive = initialData?.status === 'ACTIVE' || initialData?.status === 'FUNDED' || initialData?.status === 'COMPLETED';
  const isFinancialLocked = isLive && !isAdjustmentMode;

  const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData ? {
      ...initialData,
      coverImage: initialData.imageUrl || '',
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

  const [gallery, budget, timeline, coverImage, reason] = watch(['gallery', 'budgetBreakdown', 'executionTimeline', 'coverImage', 'reasonForGoalAdjustment']);

  const onSubmit = async (data: ProjectFormValues, status: 'DRAFT' | 'ACTIVE') => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, targetAmount: data.targetAmount * 100, status };

      if (initialData) {
        await ApiService.admin.updateProject(initialData.id, payload);
        toast.success(status === 'DRAFT' ? 'Draft Saved' : 'Project Published');
        setUnlockedSections({});
        setIsAdjustmentMode(false);
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

  const toggleSection = (section: string) => {
    setUnlockedSections(prev => ({ ...prev, [section]: !prev[section] }));
    if (section === 'identity') setIsAdjustmentMode(false);
  };

  const getInputClass = (section: string) => cn(
    "transition-all duration-300 rounded-xl h-11 text-sm pr-10",
    isSectionReadOnly(section)
      ? "bg-muted/10 border-transparent shadow-none cursor-default focus-visible:ring-0 text-foreground font-medium"
      : "bg-background border-border shadow-sm focus-visible:ring-primary/20"
  );

  const getAreaClass = (section: string, minHeight: string = "min-h-[180px]") => cn(
    "flex w-full rounded-xl border px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all duration-300 text-foreground",
    minHeight,
    isSectionReadOnly(section)
      ? "bg-muted/10 border-transparent shadow-none cursor-default resize-none font-medium"
      : "bg-background border-input focus-visible:border-primary"
  );

  const EditPencil = ({ section }: { section: string }) => (
    isSectionReadOnly(section) && initialData && (
      <div
        onClick={() => toggleSection(section)}
        className="absolute right-6 top-6 p-2 rounded-xl bg-primary shadow-lg text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer hover:scale-110 z-30"
      >
        <Edit2 className="h-4 w-4" />
      </div>
    )
  );

  return (
    <form className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">

      {/* Audit Traceability Header */}
      {initialData?.proposalId && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 w-fit">
          <ShieldCheck className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Verified Origin:</span>
          <Link href={`/admin/proposals/${initialData.proposalId}`} className="text-xs font-bold underline hover:text-blue-800 flex items-center gap-1">
            Proposal #{initialData.proposalId.split('-')[0]} <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* --- SECTION 1: IDENTITY --- */}
      <section className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-6 p-8 bg-card rounded-[32px] border transition-all duration-500 relative group",
        isSectionReadOnly('identity') ? "border-border shadow-sm" : "border-primary/30 shadow-2xl ring-1 ring-primary/5"
      )}>
        <EditPencil section="identity" />
        <div className="md:col-span-12 flex items-center gap-3 mb-4">
          <div className={cn(
            "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-inner",
            isSectionReadOnly('identity') ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}>
            {isSectionReadOnly('identity') ? <ShieldCheck className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
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
            className={getInputClass('identity')}
            readOnly={isSectionReadOnly('identity')}
            error={errors.title?.message}
          />
        </div>

        <div className="md:col-span-4 space-y-1.5 relative">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Classification</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value} disabled={isSectionReadOnly('identity')}>
                <SelectTrigger className={cn(getInputClass('identity'), "bg-background/50")}><SelectValue placeholder="Select category" /></SelectTrigger>
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
            className={cn(getAreaClass('identity', "min-h-[10px]"), "resize-none")}
            {...register('shortDesc')}
            readOnly={isSectionReadOnly('identity')}
            maxLength={140}
          />
        </div>

        <div className="md:col-span-12 space-y-1.5 relative">
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Description</label>
          <Textarea
            className={getAreaClass('identity', "min-h-[200px]")}
            {...register('description')}
            readOnly={isSectionReadOnly('identity')}
          />
        </div>

        <div className="md:col-span-6 space-y-1.5 relative">
          <div className="flex justify-between items-end mb-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">
              Geographic Location
            </label>
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
            <Input
              {...register('location')}
              className={cn(getInputClass('identity'), "pl-9")}
              readOnly={isSectionReadOnly('identity')}
            />
          </div>
        </div>

        <div className="md:col-span-6 space-y-1.5 relative">
          <div className="flex justify-between items-end mb-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-tight">Capital Goal (NGN)</label>
            {isFinancialLocked && (
              <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1 uppercase tracking-tight">
                <Lock className="h-3 w-3" /> Ledger Locked
              </span>
            )}
            {/* Adjustment trigger only visible when section is explicitly unlocked */}

          </div>
          <Controller
            control={control}
            name="targetAmount"
            render={({ field }) => (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">₦</span>
                <Input
                  value={formatNumberInput(String(field.value || ''))}
                  onChange={(e) => field.onChange(Number(parseFormattedNumber(e.target.value)))}
                  className={cn(
                    getInputClass('identity'),
                    "pl-10 font-bold tabular-nums",
                    isFinancialLocked && "bg-muted/30 text-muted-foreground cursor-not-allowed"
                  )}
                  readOnly={isFinancialLocked}
                  disabled={isFinancialLocked}
                />
              </div>
            )}
          />
        </div>

        {/* Adjustment Narrative Block */}
        {!isSectionReadOnly('identity') && isLive && (
          <div className="md:col-span-12 mt-2">
            <div className="bg-amber-500/[0.03] border border-amber-500/10 p-5 rounded-2xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-700 uppercase tracking-tight">
                      Live Project Protection
                    </p>
                    <p className="text-xs text-amber-600/80 leading-relaxed font-medium">
                      Financial goals are locked on live campaigns to preserve donor trust. If you must adjust for market volatility (inflation, vendor shifts), provide a public explanation below.
                    </p>
                  </div>
                </div>

                {!isAdjustmentMode && !isSectionReadOnly('identity') && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAdjustmentMode(true)}
                    className="rounded-xl h-10 px-5 font-bold border-amber-500/30 text-amber-700 gap-2 shrink-0"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Adjust Goal
                  </Button>
                )}
              </div>

              {isAdjustmentMode && (
                <div className="space-y-2 pt-4 border-t border-amber-500/10 animate-in slide-in-from-top-1">
                  <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Public Amendment Narrative (Required)</label>
                  <Textarea
                    {...register('reasonForGoalAdjustment')}
                    placeholder="e.g. Due to recent inflation spikes, the cost per solar unit has increased by 15%..."
                    className="min-h-[100px] bg-white border-amber-200 focus-visible:ring-amber-500/20 text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* --- SECTION 2: MEDIA --- */}
      <section className={cn(
        "bg-card p-8 rounded-[32px] border shadow-sm space-y-8 transition-all duration-500 relative group",
        isSectionReadOnly('media') ? "border-border shadow-sm" : "border-primary/30 shadow-2xl ring-1 ring-primary/5"
      )}>
        <EditPencil section="media" />
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner", isSectionReadOnly('media') ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
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
                {!isSectionReadOnly('media') && (
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
            <div className={cn(isSectionReadOnly('media') && "pointer-events-none opacity-95")}>
              <MediaManager
                items={gallery as any}
                onAdd={(item) => !isSectionReadOnly('media') && setValue('gallery', [...gallery, item])}
                onRemove={(id) => !isSectionReadOnly('media') && setValue('gallery', gallery.filter((i) => i.id !== id))}
                onUpdate={(id, updates) => !isSectionReadOnly('media') && setValue('gallery', gallery.map((i) => i.id === id ? { ...i, ...updates } : i))}
                readOnly={isSectionReadOnly('media')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 3: PLAN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className={cn(
          "p-8 bg-card rounded-[32px] border space-y-6 transition-all duration-500 relative group",
          isSectionReadOnly('plan') ? "border-border shadow-sm" : "border-primary/30 shadow-2xl ring-1 ring-primary/5"
        )}>
          <EditPencil section="plan" />
          <div className="flex items-center gap-3 mb-2">
            <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner", isSectionReadOnly('plan') ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground leading-none">Budget Ledger</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Vendor procurement plan</p>
            </div>
          </div>
          <BudgetEditor items={budget as any} onChange={(items) => setValue('budgetBreakdown', items as any)} readOnly={isSectionReadOnly('plan')} />
        </div>

        <div className={cn(
          "p-8 bg-card rounded-[32px] border space-y-6 transition-all duration-500 relative group",
          isSectionReadOnly('plan') ? "border-border shadow-sm" : "border-primary/30 shadow-2xl ring-1 ring-primary/5"
        )}>
          <EditPencil section="plan" />
          <div className="flex items-center gap-3 mb-4">
            <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shadow-inner", isSectionReadOnly('plan') ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground leading-none">Execution Roadmap</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Milestone tracking</p>
            </div>
          </div>

          {!isSectionReadOnly('plan') && (
            <div className="bg-primary/5 border border-primary/10 p-3 rounded-xl mb-4">
              <p className="text-[11px] text-primary/80 font-medium leading-relaxed">
                <strong>Pro Tip:</strong> Define clear, verifiable milestones. This timeline is donor-facing and serves as the source of truth for funds release.
              </p>
            </div>
          )}

          <TimelineEditor items={timeline as any} onChange={(items) => setValue('executionTimeline', items as any)} readOnly={isSectionReadOnly('plan')} />
        </div>
      </div>

      {/* --- STICKY FOOTER ACTIONS --- */}
      {showFooter && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border z-50 md:pl-[300px] animate-in slide-in-from-bottom-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            {initialData ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => { setUnlockedSections({}); setIsAdjustmentMode(false); }}
                className="rounded-xl h-12 px-6 font-bold text-muted-foreground hover:text-foreground"
              >
                Cancel Edits
              </Button>
            ) : (
              <div />
            )}

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
                disabled={isSubmitting || (isAdjustmentMode && !reason)}
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

    </form>
  );
}