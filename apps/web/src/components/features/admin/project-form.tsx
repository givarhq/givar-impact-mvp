'use client';

import React, { useState, memo, useMemo, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import Image from 'next/image';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import {
  Loader2, Save, X, Image as ImageIcon, Video,
  Briefcase, MapPin, ShieldCheck, ExternalLink,
  LockOpen, Fingerprint, FileText, Send, Trash2,
  Tag, Clock, Landmark
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { RichTextEditor } from '../../ui/rich-text-editor';
import { ApiService } from '../../../services/api';
import { BudgetEditor } from '../proposals/budget-editor';
import { MediaManager, ImageUploader, VideoUploader } from '../proposals/media-uploader';
import { formatNumberInput, parseFormattedNumber, toTitleCase, toSentenceCase } from '../../../lib/utils/format';
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

const vendorItemSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Vendor name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  subaccountCode: z.string().optional()
});

const budgetItemSchema = z.object({
  id: z.string(),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
  vendorId: z.string().optional(),
  costType: z.string().optional(),
  stage: z.string().optional(),
  isNewDraft: z.boolean().optional(),
});

const projectSchema = z.object({
  title: z.string().min(5, "The title is a bit too short"),
  description: z.string().min(10, "Please provide a more detailed description"),
  shortDesc: z.string().optional(),
  personalMessage: z.string().optional().nullable(),
  categoryId: z.string().uuid("Please select a sector"),
  subcategoryId: z.string().uuid("Please select a specific focus").optional().nullable(),
  location: z.string().min(2, "A location is required"),
  targetAmount: z.number().min(100, "Minimum goal amount is 100"),
  currency: z.enum(['NGN', 'USD', 'GBP']),
  coverImage: z.string().min(1, "A primary image is required"),
  videoUrl: z.string().optional().nullable(),
  gallery: z.array(mediaItemSchema),
  vendors: z.array(vendorItemSchema),
  budgetBreakdown: z.array(budgetItemSchema),
  executionTimeline: z.any().optional(),
  reasonForGoalAdjustment: z.string().optional(),
  amendmentInvoiceKey: z.string().optional(),
  endDate: z.string().optional().nullable(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: any;
  categories: any[];
}

export const AdminProjectForm = memo(function AdminProjectForm({ initialData, categories }: ProjectFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const applyParamConsumed = useRef(false);

  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.imageUrl || null);
  const [videoPreview, setVideoPreview] = useState<string | null>(initialData?.videoUrl || null);

  const isLive = initialData?.status === 'ACTIVE' || initialData?.status === 'FUNDED' || initialData?.status === 'COMPLETED';
  const readOnly = initialData ? !isEditing : false;
  const isAdjustmentMode = isLive && isEditing;

  const { loadedVendors, mappedBudget } = useMemo(() => {
    const v = initialData?.vendors ? [...initialData.vendors] : [];
    const b = (initialData?.budgetBreakdown || []).map((b: any) => {
      let resolvedVendorId = b.vendorId || '';
      if (!resolvedVendorId && (b.payTo || b.vendor)) {
        const legacyName = b.payTo || b.vendor;
        const existing = v.find(v => v.name === legacyName);
        if (existing) {
          resolvedVendorId = existing.id;
        } else {
          const newId = crypto.randomUUID();
          v.push({ id: newId, name: legacyName, email: b.vendorEmail || '', phone: b.vendorPhone || b.vendorContact || '', subaccountCode: b.vendorSubaccount || '' });
          resolvedVendorId = newId;
        }
      }
      return {
        id: b.id || crypto.randomUUID(),
        vendorId: resolvedVendorId,
        costType: b.costType || b.type || 'SERVICE',
        amount: b.amount !== undefined ? b.amount : (b.cost || 0),
        description: b.description || b.item || '',
        stage: b.stage || ''
      };
    });
    return { loadedVendors: v, mappedBudget: b };
  }, [initialData]);

  const { register, control, handleSubmit, setValue, getValues, watch, formState: { errors }, reset } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData ? {
      ...initialData,
      coverImage: initialData.imageUrl || '',
      videoUrl: initialData.videoUrl || '',
      gallery: initialData.gallery || [],
      vendors: loadedVendors,
      budgetBreakdown: mappedBudget,
      executionTimeline: initialData.executionTimeline || [],
      personalMessage: initialData.personalMessage || '',
      targetAmount: initialData.targetAmount ? Number(initialData.targetAmount) / 100 : undefined,
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
      reasonForGoalAdjustment: '',
      amendmentInvoiceKey: '',
      subcategoryId: initialData.subcategoryId || '',
    } : {
      currency: 'NGN',
      gallery: [],
      vendors: [],
      budgetBreakdown: [],
      executionTimeline: [],
      personalMessage: '',
      endDate: '',
      subcategoryId: '',
    }
  });

  const [gallery, vendors, budget, coverImage, videoUrl, reason, description, selectedCategoryId, titleValue, shortDescValue, personalMessageValue, locationValue] = watch([
    'gallery',
    'vendors',
    'budgetBreakdown',
    'coverImage',
    'videoUrl',
    'reasonForGoalAdjustment',
    'description',
    'categoryId',
    'title',
    'shortDesc',
    'personalMessage',
    'location'
  ]);

  // Handle Amendment Application strictly ONCE
  useEffect(() => {
    const applyAmendment = searchParams.get('applyAmendment');

    if (applyAmendment && !applyParamConsumed.current) {
      applyParamConsumed.current = true;
      try {
        const data = JSON.parse(decodeURIComponent(applyAmendment));

        // Use getValues() to ensure we push to the current React Hook Form state
        const currentVendors = getValues('vendors') || loadedVendors;
        const currentBudget = getValues('budgetBreakdown') || mappedBudget;

        let finalVendorId = data.vendorId;
        if (data.vendorId === 'NEW') {
          finalVendorId = crypto.randomUUID();
          const newVendor = {
            id: finalVendorId,
            name: data.newVendorName || 'New Vendor',
            email: data.newVendorEmail || '',
            phone: data.newVendorPhone || '',
            subaccountCode: ''
          };
          setValue('vendors', [...currentVendors, newVendor], { shouldDirty: true });
        }

        const newItem = {
          id: crypto.randomUUID(),
          vendorId: finalVendorId,
          costType: 'SERVICE',
          amount: Number(data.amount) / 100, // DB stores minor, Form expects major
          description: data.expenseDesc,
          stage: 'Final Stage',
          isNewDraft: true
        };

        setValue('budgetBreakdown', [...currentBudget, newItem], { shouldDirty: true });
        setValue('reasonForGoalAdjustment', `Organizer Request: ${data.expenseDesc}`, { shouldDirty: true });
        setValue('amendmentInvoiceKey', data.invoiceKey, { shouldDirty: true });

        // CRITICAL: Unlock form to modification mode immediately
        setIsEditing(true);

        // Strip parameter securely WITHOUT triggering a Next.js server component reload
        const newUrl = `${pathname}?tab=details`;
        window.history.replaceState(null, '', newUrl);

        // Smooth scroll precisely to the end of the budget editor
        setTimeout(() => {
          const element = document.getElementById('budget-editor-section');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 500);

      } catch (e) {
        console.error("Failed to parse amendment data", e);
      }
    }
  }, [searchParams, pathname, loadedVendors, mappedBudget, setValue, getValues]);

  // Ensure Target Amount stays perfectly synched with Budget Math
  useEffect(() => {
    if (isEditing) {
      const total = budget.reduce((sum, item) => sum + (item.amount || 0), 0);
      setValue('targetAmount', total, { shouldDirty: true });
    }
  }, [budget, isEditing, setValue]);

  const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  const handleVideoUpload = (data: { key: string; previewUrl: string }) => {
    setValue('videoUrl', data.key, { shouldDirty: true });
    setVideoPreview(data.previewUrl);
  };

  const onSubmit = async (data: ProjectFormValues, status: 'DRAFT' | 'ACTIVE') => {
    if (!data.subcategoryId) {
      return toast.error("Please select a specific focus area before saving.");
    }

    if (status === 'ACTIVE') {
      const unboundItems = data.budgetBreakdown.filter((item: any) => {
        if (!item.vendorId) return true;
        const vendor = data.vendors?.find((v: any) => v.id === item.vendorId);
        return !vendor || !vendor.subaccountCode;
      });
      if (unboundItems.length > 0) {
        return toast.error("Strict Non-Custodial Policy: Bind a vendor subaccount to every budget item before launching.");
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading(status === 'DRAFT' ? "Saving your progress..." : "Publishing cause...");
    try {
      const payload = {
        ...data,
        targetAmount: data.targetAmount * 100,
        status,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        // Strip the client-only isNewDraft flag so it doesn't fail the backend DTO validation
        budgetBreakdown: data.budgetBreakdown.map((b: any) => {
          const { isNewDraft, ...rest } = b;
          if (rest.stage === '') delete rest.stage;
          return rest;
        })
      };

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
      setVideoPreview(initialData.videoUrl || null);
      setIsEditing(false);
    }
  };

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleBlurTitle = () => { if (titleValue) setValue('title', toTitleCase(titleValue), { shouldDirty: true }); };
  const handleBlurShortDesc = () => { if (shortDescValue) setValue('shortDesc', toSentenceCase(shortDescValue), { shouldDirty: true }); };
  const handleBlurPersonalMessage = () => { if (personalMessageValue) setValue('personalMessage', toSentenceCase(personalMessageValue), { shouldDirty: true }); };
  const handleBlurLocation = () => { if (locationValue) setValue('location', toTitleCase(locationValue), { shouldDirty: true }); };

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
              <span className="text-[11px] font-bold">Verified Origin:</span>
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
                <h3 className="text-base font-bold text-amber-900 tracking-tight">Project Amendment</h3>
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  You are editing a live project. Any changes to the financial goal, budget, or roadmap require a brief explanation for our donors.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-bold text-amber-800">Narrative</label>
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
            <input type="hidden" {...register('amendmentInvoiceKey')} />
          </motion.div>
        )}
      </AnimatePresence>

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
            <p className="text-xs text-muted-foreground font-medium mt-1.5 tracking-tight">Essential project metadata and classification</p>
          </div>
        </div>

        <div className="md:col-span-8 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center h-4">Cause Headline</label>
          {readOnly ? (
            <div className="h-12 flex items-center px-5 rounded-3xl bg-muted/10 text-foreground font-bold text-sm border-transparent shadow-none truncate" title={watch('title')}>
              {watch('title')}
            </div>
          ) : (
            <Input {...register('title')} onBlur={handleBlurTitle} className={getInputClass()} placeholder="Enter a compelling title..." error={errors.title?.message} />
          )}
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center h-4">Sector Classification</label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select onValueChange={(val) => { field.onChange(val); if (!readOnly) setValue('subcategoryId', '', { shouldValidate: true }); }} value={field.value || undefined} disabled={readOnly}>
                <SelectTrigger className={cn(getInputClass(), "bg-muted/10")}>
                  <SelectValue placeholder="Select a sector" />
                </SelectTrigger>
                <SelectContent className="rounded-3xl shadow-2xl border-border/40 p-2">
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id} className="rounded-2xl text-xs font-bold py-3">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center gap-1.5 h-4">
            <Tag className="h-3 w-3" /> Specific Focus
          </label>
          <Controller
            control={control}
            name="subcategoryId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || undefined} disabled={readOnly || !selectedCategoryId}>
                <SelectTrigger className={cn(getInputClass(), "bg-muted/10 disabled:opacity-50")}>
                  <SelectValue placeholder="Select focus..." />
                </SelectTrigger>
                <SelectContent className="rounded-3xl shadow-2xl border-border/40 p-2">
                  {availableSubcategories.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground text-center italic">Select a sector first</div>
                  ) : (
                    availableSubcategories.map((sub: any) => <SelectItem key={sub.id} value={sub.id} className="rounded-2xl text-xs font-bold py-3">{sub.name}</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.subcategoryId && <p className="text-[11px] font-bold text-destructive px-1">{errors.subcategoryId.message}</p>}
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center h-4">Primary Location</label>
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input {...register('location')} onBlur={handleBlurLocation} placeholder="e.g. Lagos, Nigeria" className={cn(getInputClass(), "pl-11")} readOnly={readOnly} />
          </div>
        </div>

        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center h-4">Capital Funding Goal (NGN)</label>
          <Controller
            control={control}
            name="targetAmount"
            render={({ field }) => (
              <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm">₦</span>
                <Input
                  value={formatNumberInput(String(field.value || ''))}
                  onChange={(e) => field.onChange(Number(parseFormattedNumber(e.target.value)))}
                  className={cn(getInputClass(), "pl-11 font-black tabular-nums text-lg", isEditing && "bg-muted/10 opacity-70 pointer-events-none")}
                  placeholder="0.00"
                  readOnly={true} // Auto-calculates via Budget Editor
                />
              </div>
            )}
          />
        </div>

        <div className="md:col-span-12 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground ml-1">Short Elevator Pitch</label>
          <Textarea className={cn(getAreaClass("min-h-[80px]"), "resize-none rounded-3xl")} {...register('shortDesc')} onBlur={handleBlurShortDesc} readOnly={readOnly} placeholder="A brief summary for donor lists..." maxLength={140} />
        </div>

        <div className="md:col-span-12 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground ml-1">Personal Message</label>
          <Textarea className={cn(getAreaClass("min-h-[100px]"), "resize-none rounded-3xl")} {...register('personalMessage')} onBlur={handleBlurPersonalMessage} readOnly={readOnly} placeholder="A direct, human appeal..." maxLength={500} />
        </div>

        <div className="md:col-span-12 space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground ml-1">Project Mission Narrative</label>
          <RichTextEditor content={description || ''} onChange={(val) => setValue('description', val, { shouldDirty: true })} readOnly={readOnly} />
          {errors.description && <p className="text-xs text-destructive mt-2 font-bold px-2">{errors.description.message}</p>}
        </div>
      </section>

      {/* Visual Assets Section */}
      <section className={cn(
        "bg-card p-6 md:p-10 rounded-3xl border shadow-sm space-y-8 transition-all duration-500 relative group overflow-hidden",
        readOnly ? "border-border/40" : "border-primary/30 ring-4 ring-primary/5"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0", readOnly ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/20")}>
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-foreground leading-none">Visual Assets</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1.5 tracking-tight">Photos and documents for proof of impact</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2 px-1">
              <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <label className="text-[11px] font-bold text-muted-foreground tracking-widest">Primary hero image</label>
            </div>
            {coverPreview || coverImage ? (
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/40 group shadow-md bg-muted">
                <Image src={coverPreview || coverImage} alt="Project Hero" fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized />
                {!readOnly && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm">
                    <Button type="button" variant="destructive" size="sm" className="rounded-3xl h-10 px-6 font-bold text-xs shadow-xl active:scale-95" onClick={() => { setValue('coverImage', '', { shouldDirty: true }); setCoverPreview(null); }}>
                      <X className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video">
                <ImageUploader label="Upload image" onUploadComplete={(data) => { setValue('coverImage', data.key, { shouldDirty: true }); setCoverPreview(data.previewUrl); }} />
              </div>
            )}
            {errors.coverImage && <p className="text-[11px] font-bold text-destructive px-2 mt-1">{errors.coverImage.message}</p>}
          </div>

          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2 px-1">
              <Video className="h-3.5 w-3.5 text-muted-foreground" />
              <label className="text-[11px] font-bold text-muted-foreground tracking-widest">Pitch Video (Optional)</label>
            </div>
            {videoPreview ? (
              <div className="relative aspect-video rounded-3xl overflow-hidden border border-border/40 group shadow-md bg-black">
                <video src={videoPreview} controls className="w-full h-full object-contain" />
                {!readOnly && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="destructive" size="icon" className="rounded-full h-8 w-8 shadow-lg" onClick={() => { setValue('videoUrl', null, { shouldDirty: true }); setVideoPreview(null); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : readOnly ? (
              <div className="aspect-video flex items-center justify-center rounded-3xl border border-border/40 bg-muted/10">
                <span className="text-xs font-bold text-muted-foreground/40">No video attached</span>
              </div>
            ) : (
              <div className="aspect-video">
                <VideoUploader useCase="public" onUploadComplete={handleVideoUpload} label="Upload short video" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 min-w-0 pt-4 border-t border-border/40">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-bold text-muted-foreground  tracking-widest">Supporting Gallery</label>
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-3xl border border-primary/10">{gallery.length} / 10 assets</span>
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
      </section>

      {/* Financial Budget Section */}
      <Card id="budget-editor-section" className={cn(
        "p-6 md:p-10 bg-card rounded-3xl border space-y-8 transition-all duration-500 relative group overflow-hidden shadow-sm",
        readOnly ? "border-border/40" : "border-primary/30 shadow-lg"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shadow-inner shrink-0", readOnly ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/20")}>
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground leading-none">Use of Funds</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1.5 tracking-tight">Detailed financial breakdown and vendor routing</p>
          </div>
        </div>
        <BudgetEditor
          budgetItems={budget as any}
          onBudgetChange={(items) => setValue('budgetBreakdown', items as any, { shouldDirty: true })}
          vendorsList={vendors as any}
          onVendorsChange={(items) => setValue('vendors', items as any, { shouldDirty: true })}
          readOnly={readOnly}
          isLive={isLive}
          isAdjustmentMode={isAdjustmentMode}
          isAdmin={true}
          proposalId={initialData?.proposalId || initialData?.id}
        />
      </Card>

      {/* Control Terminal Bar */}
      {(isEditing || !initialData) && (
        <div className="fixed md:bottom-0 bottom-14 left-0 md:left-[260px] right-0 p-4 md:p-5 bg-background/90 backdrop-blur-2xl border-t border-border/40 z-50 shadow-2xl">
          <div className="max-w-6xl mx-auto flex flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                title={initialData ? 'Discard changes' : 'Cancel setup'}
                className="rounded-full h-11 w-11 p-0 flex items-center justify-center text-muted-foreground hover:bg-muted transition-all active:scale-95"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-auto min-w-0">
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit((d) => onSubmit(d, 'DRAFT'))}
                variant="secondary"
                title="Save as Draft"
                className="rounded-full h-11 w-11 p-0 flex items-center justify-center border border-border/60 bg-muted/40 shadow-none hover:bg-muted active:scale-95 transition-all"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </Button>

              <Button
                type="button"
                disabled={isSubmitting || (isAdjustmentMode && (!reason || reason.length < 10))}
                onClick={handleSubmit((d) => onSubmit(d, 'ACTIVE'))}
                className="w-auto rounded-3xl h-11 px-5 md:px-6 font-bold text-[11px] shadow-xl shadow-primary/30 active:scale-[0.98] transition-all bg-primary text-white border-0"
              >
                {isSubmitting ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <div className="flex items-center justify-center gap-2 min-w-0">
                    {initialData ? <Save className="h-4 w-4 shrink-0" /> : <Send className="h-4 w-4 shrink-0" />}
                    {initialData ? 'Publish' : 'Launch'}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Unlock Button for Read-Only Mode */}
      {initialData && !isEditing && (
        <div className="fixed bottom-20 md:bottom-10 right-6 md:right-10 z-50">
          <Button type="button" onClick={handleStartEditing} className="rounded-full h-14 px-8 font-bold gap-3 text-sm shadow-2xl shadow-primary/30 bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98] border-0">
            <LockOpen className="h-5 w-5" /> Modify
          </Button>
        </div>
      )}
    </div>
  );
});