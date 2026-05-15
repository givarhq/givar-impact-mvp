'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useProposalStore } from '../../../../../../../../stores/proposal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../../../../components/ui/card';
import { Button } from '../../../../../../../../components/ui/button';
import { Input } from '../../../../../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../../../../components/ui/select';
import { Textarea } from '../../../../../../../../components/ui/textarea';
import { RichTextEditor } from '../../../../../../../../components/ui/rich-text-editor';
import { ApiService } from '../../../../../../../../services/api';
import { ArrowRight, Loader2, User, Users, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../../../../../../../lib/utils/cn';
import { toTitleCase, toSentenceCase } from '../../../../../../../../lib/utils/format';
import { Controller, useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { getCookie } from 'cookies-next';

export default function HookPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const {
    title, shortDesc, description, personalMessage, location, endDate,
    categoryId, subcategoryId,
    beneficiaryName, beneficiaryAge, beneficiaryRelationship, beneficiaryContact,
    organizationName, contactPhone,
    setProposal, updateField
  } = useProposalStore();

  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [targetType, setTargetType] = useState<'SELF' | 'OTHER' | 'INDIVIDUAL' | 'GROUP' | null>(null);
  const [userAccountType, setUserAccountType] = useState<string>('INDIVIDUAL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userCookie = getCookie('givar_user');
        let parsedAccountType = 'INDIVIDUAL';
        if (userCookie) {
          try {
            const parsedUser = JSON.parse(userCookie as string);
            if (parsedUser.accountType) parsedAccountType = parsedUser.accountType;
          } catch (e) { }
        }
        setUserAccountType(parsedAccountType);

        const currentState = useProposalStore.getState();

        const [proposalData, cats] = await Promise.all([
          currentState.id !== proposalId ? ApiService.proposals.get(proposalId) : Promise.resolve(null),
          ApiService.projects.getCategories()
        ]);
        setCategories(cats || []);

        if (proposalData) {
          setProposal(proposalData);
        }

        const activeData = proposalData || currentState;

        if (activeData.organizationName) {
          setTargetType('GROUP');
        } else if (activeData.beneficiaryRelationship === 'Self') {
          setTargetType('SELF');
        } else if (activeData.beneficiaryName) {
          setTargetType(parsedAccountType === 'ORGANIZER' ? 'INDIVIDUAL' : 'OTHER');
        }

      } catch (error) {
        toast.error("Draft failed to load");
        router.push('/dashboard/proposals');
      } finally {
        setIsLoading(false);
      }
    };

    if (proposalId) fetchData();
  }, [proposalId, setProposal, router]);

  const { control, setValue } = useForm({
    defaultValues: { categoryId, subcategoryId }
  });

  const selectedCategoryObj = categories.find(c => c.id === categoryId);
  const selectedCategoryName = selectedCategoryObj?.name?.toLowerCase() || '';
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  // Contextual Label Generator
  const getDynamicLabels = () => {
    const isOrg = userAccountType === 'ORGANIZER';

    if (selectedCategoryName.includes('medical')) {
      return {
        optSelf: "Myself (patient)",
        optOther: isOrg ? "A patient" : "Another patient",
        optGroup: "A facility or health initiative",
        nameLabel: "Patient's full legal name",
        ageLabel: "Patient's current age",
        relLabel: "Relationship to patient",
        orgLabel: "Name of clinic or hospital",
      };
    }
    if (selectedCategoryName.includes('education')) {
      return {
        optSelf: "Myself (student)",
        optOther: isOrg ? "A student" : "Another student",
        optGroup: "A school or group",
        nameLabel: "Student's full legal name",
        ageLabel: "Student's current age",
        relLabel: "Relationship to student",
        orgLabel: "Name of school or institution",
      };
    }
    if (selectedCategoryName.includes('community')) {
      return {
        optSelf: "Myself (general support)",
        optOther: isOrg ? "An individual or family" : "Another individual or family",
        optGroup: "A community or region",
        nameLabel: "Beneficiary's full legal name",
        ageLabel: "Beneficiary's age",
        relLabel: "Relationship to beneficiary",
        orgLabel: "Name of community or region",
      };
    }
    return {
      optSelf: "Myself",
      optOther: isOrg ? "An individual" : "Someone else",
      optGroup: "A group or community",
      nameLabel: "Beneficiary full name",
      ageLabel: "Current age",
      relLabel: "Relationship to submitter",
      orgLabel: "Name of group or community",
    };
  };

  const dynamicLabels = getDynamicLabels();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground min-w-0">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Formatting Handlers
  const handleBlurTitle = () => { if (title) updateField('title', toTitleCase(title)); };
  const handleBlurShortDesc = () => { if (shortDesc) updateField('shortDesc', toSentenceCase(shortDesc)); };
  const handleBlurPersonalMessage = () => { if (personalMessage) updateField('personalMessage', toSentenceCase(personalMessage)); };
  const handleBlurLocation = () => { if (location) updateField('location', toTitleCase(location)); };

  const handleTargetTypeChange = (type: 'SELF' | 'OTHER' | 'INDIVIDUAL' | 'GROUP') => {
    setTargetType(type);
    if (type === 'SELF') {
      updateField('beneficiaryRelationship', 'Self');
      updateField('beneficiaryName', null);
      updateField('beneficiaryAge', null);
      updateField('beneficiaryContact', null);
      updateField('organizationName', null);
      updateField('contactPhone', null);
    } else if (type === 'GROUP') {
      updateField('beneficiaryRelationship', null);
      updateField('beneficiaryName', null);
      updateField('beneficiaryAge', null);
      updateField('beneficiaryContact', null);
    } else {
      // OTHER or INDIVIDUAL
      updateField('organizationName', null);
      updateField('contactPhone', null);
      updateField('beneficiaryRelationship', null);
    }
  };

  // Validation Logic
  const strippedDescription = description ? description.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim() : '';
  const titleValid = !!(title && title.trim().length >= 10);
  const locationValid = !!(location && location.trim().length >= 2);
  const descValid = strippedDescription.length >= 20;
  const isHookValid = titleValid && locationValid && descValid;

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
              label="Cause title *"
              placeholder="e.g. Clean water for Owerri communities"
              value={title}
              onChange={(e) => updateField('title', e.target.value)}
              onBlur={handleBlurTitle}
              className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
            />

            {/* SECTOR CLASSIFICATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 min-w-0">
              <div className="space-y-1.5 min-w-0">
                <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center h-4">Primary sector</label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        updateField('categoryId', val);
                        updateField('subcategoryId', null as any);
                        setValue('subcategoryId', null as any, { shouldValidate: true });
                      }}
                      value={categoryId || undefined}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background font-medium text-sm">
                        <SelectValue placeholder="Select a sector..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-[22px] shadow-xl border-border/40">
                        {categories.length === 0 ? (
                          <div className="p-4 text-xs text-muted-foreground text-center italic">Loading...</div>
                        ) : (
                          categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id} className="rounded-xl text-xs py-2.5 font-bold">{cat.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-[11px] font-bold text-muted-foreground ml-1 flex items-center gap-1.5 h-4">
                  <Tag className="h-3 w-3" /> Specific focus
                </label>
                <Controller
                  control={control}
                  name="subcategoryId"
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => {
                        field.onChange(val);
                        updateField('subcategoryId', val);
                      }}
                      value={subcategoryId || undefined}
                      disabled={isLoading || !categoryId}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-border/40 bg-muted/20 focus:bg-background font-medium text-sm disabled:opacity-50">
                        <SelectValue placeholder="Select focus..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-[22px] shadow-xl border-border/40">
                        {availableSubcategories.length === 0 ? (
                          <div className="p-4 text-xs text-muted-foreground text-center italic">Select a sector first</div>
                        ) : (
                          availableSubcategories.map((sub: any) => (
                            <SelectItem key={sub.id} value={sub.id} className="rounded-xl text-xs py-2.5 font-bold">{sub.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* WHO IS THIS CAUSE FOR */}
            <div className="space-y-3 p-5 md:p-6 rounded-3xl bg-muted/10 border border-border/40 shadow-sm mt-6">
              <label className="text-[11px] font-bold text-muted-foreground flex items-center h-4">Who is this cause for?</label>
              <div className="flex flex-wrap gap-3">
                {userAccountType === 'ORGANIZER' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('INDIVIDUAL')}
                      className={cn(
                        "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px]",
                        targetType === 'INDIVIDUAL' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                      )}
                    >
                      <User className="h-4 w-4 shrink-0" /> <span className="leading-snug text-left">{dynamicLabels.optOther}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('GROUP')}
                      className={cn(
                        "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px]",
                        targetType === 'GROUP' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                      )}
                    >
                      <Users className="h-4 w-4 shrink-0" /> <span className="leading-snug text-left">{dynamicLabels.optGroup}</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('SELF')}
                      className={cn(
                        "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px]",
                        targetType === 'SELF' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                      )}
                    >
                      <User className="h-4 w-4 shrink-0" /> <span className="leading-snug text-left">{dynamicLabels.optSelf}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('OTHER')}
                      className={cn(
                        "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px]",
                        targetType === 'OTHER' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                      )}
                    >
                      <User className="h-4 w-4 shrink-0" /> <span className="leading-snug text-left">{dynamicLabels.optOther}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('GROUP')}
                      className={cn(
                        "flex-1 py-3.5 px-4 rounded-2xl text-xs font-bold border transition-all flex items-center justify-center gap-2 active:scale-[0.98] min-h-[52px]",
                        targetType === 'GROUP' ? "bg-primary/5 text-primary border-primary shadow-sm" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                      )}
                    >
                      <Users className="h-4 w-4 shrink-0" /> <span className="leading-snug text-left">{dynamicLabels.optGroup}</span>
                    </button>
                  </>
                )}
              </div>

              <AnimatePresence>
                {(targetType === 'OTHER' || targetType === 'INDIVIDUAL') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden"
                  >
                    <Input
                      label={dynamicLabels.nameLabel}
                      placeholder="Legal name"
                      value={beneficiaryName || ''}
                      onChange={(e) => updateField('beneficiaryName', e.target.value)}
                      className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                    />
                    <Input
                      label={dynamicLabels.ageLabel}
                      type="number"
                      placeholder="Age"
                      value={beneficiaryAge || ''}
                      onChange={(e) => updateField('beneficiaryAge', parseInt(e.target.value))}
                      className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                    />
                    <Input
                      label={dynamicLabels.relLabel}
                      placeholder="e.g. Parent, Sibling, Friend"
                      value={beneficiaryRelationship || ''}
                      onChange={(e) => updateField('beneficiaryRelationship', e.target.value)}
                      className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                    />
                    <Input
                      label="Phone number (optional)"
                      placeholder="Direct contact number"
                      value={beneficiaryContact || ''}
                      onChange={(e) => updateField('beneficiaryContact', e.target.value)}
                      className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                    />
                  </motion.div>
                )}
                {targetType === 'GROUP' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-5 overflow-hidden"
                  >
                    <Input
                      label={dynamicLabels.orgLabel}
                      placeholder="e.g. Owerri Youth Coalition"
                      value={organizationName || ''}
                      onChange={(e) => updateField('organizationName', e.target.value)}
                      className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                    />
                    <Input
                      label="Representative contact number"
                      placeholder="Direct contact number"
                      value={contactPhone || ''}
                      onChange={(e) => updateField('contactPhone', e.target.value)}
                      className="h-12 rounded-2xl bg-card border-border/60 focus:bg-background"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Textarea
              label="Elevator pitch"
              placeholder="A punchy one-liner (max 140 chars)..."
              value={shortDesc || ''}
              onChange={(e) => updateField('shortDesc', e.target.value)}
              onBlur={handleBlurShortDesc}
              maxLength={140}
              className="h-24 rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
            />

            <div className="space-y-1.5 min-w-0">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-muted-foreground/80">Cause description *</label>
              </div>
              <RichTextEditor
                content={description || ''}
                onChange={(content) => updateField('description', content)}
                placeholder="Tell the full story. Who are the beneficiaries & what is the solution?"
              />
            </div>

            <Textarea
              label="Personal message (optional)"
              placeholder="A direct, human appeal to your potential donors..."
              value={personalMessage || ''}
              onChange={(e) => updateField('personalMessage', e.target.value)}
              onBlur={handleBlurPersonalMessage}
              className="h-32 rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-w-0">
              <Input
                label="Primary location *"
                placeholder="e.g. Lagos, Nigeria"
                value={location || ''}
                onChange={(e) => updateField('location', e.target.value)}
                onBlur={handleBlurLocation}
                className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
              />

              <Input
                label="Deadline (optional)"
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
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 text-center">
                  Complete required fields
                </span>
              )}
              <Button
                disabled={!isHookValid || !categoryId || !subcategoryId}
                className="w-full sm:w-auto h-12 rounded-3xl px-10 font-bold text-sm shadow-lg shadow-primary/20 gap-2 active:scale-[0.98] transition-all border-0 bg-primary hover:bg-primary/90 text-white min-w-0"
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