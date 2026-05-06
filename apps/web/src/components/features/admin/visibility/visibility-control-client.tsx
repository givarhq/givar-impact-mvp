'use client';

import React, { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Zap,
    Trash2,
    Plus,
    Loader2,
    Save,
    RefreshCw,
    SlidersHorizontal,
    LayoutGrid,
    TrendingUp,
    CheckCircle2,
    Info,
    ArrowDown,
    ArrowUp,
    List,
    Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { ApiService } from '../../../../services/api';
import { Project } from '../../../../types';
import { ProjectSelectorModal } from './project-selector-modal';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface VisibilityControlProps {
    initialConfig: {
        id: string;
        recencyWeight: number;
        velocityWeight: number;
        engagementWeight: number;
        adminWeight: number;
        diversityLimit: number;
        showFundedProjects: boolean;
    };
    initialSlots: any[];
    categories: any[];
}

const SettingTooltip = ({ content }: { content: string }) => (
    <div className="relative group inline-flex items-center ml-2 align-middle">
        <button
            type="button"
            className="text-muted-foreground/50 hover:text-primary transition-colors focus:outline-none focus:text-primary"
            aria-label="More information"
        >
            <Info className="h-3.5 w-3.5" />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-zinc-950 text-white text-[11px] font-medium leading-relaxed rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 z-50 pointer-events-none text-center normal-case tracking-normal">
            {content}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-950" />
        </div>
    </div>
);

export const VisibilityControlClient = memo(function VisibilityControlClient({ initialConfig, initialSlots, categories }: VisibilityControlProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState(initialConfig);
    const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>(
        categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.visibilityWeight || 1.0 }), {})
    );
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [activePosition, setActivePosition] = useState<number | null>(null);

    // Sort categories by weight for display so Admin sees the actual order
    const sortedCategories = [...categories].sort((a, b) =>
        (categoryWeights[b.id] || 1) - (categoryWeights[a.id] || 1)
    );

    const handleUpdateConfig = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Syncing discovery logic...");
        try {
            await Promise.all([
                ApiService.admin.updateConfig(config),
                ...Object.entries(categoryWeights).map(([id, weight]) =>
                    ApiService.admin.updateCategoryWeight(id, weight)
                )
            ]);
            toast.success("Feed algorithm updated", { id: toastId });
            router.refresh();
        } catch (e: any) {
            toast.error("Failed to sync settings", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const openSelector = (position: number) => {
        setActivePosition(position);
        setIsSelectorOpen(true);
    };

    const handleSelectProject = async (project: Project) => {
        if (activePosition === null) return;
        const toastId = toast.loading(`Pinning ${project.title}...`);
        try {
            await ApiService.admin.createSlot({
                projectId: project.id,
                position: activePosition
            });
            toast.success("Featured slot updated", { id: toastId });
            setIsSelectorOpen(false);
            router.refresh();
        } catch (e) {
            toast.error("Pin failed", { id: toastId });
        }
    };

    const handleRemoveSlot = async (slotId: string) => {
        const toastId = toast.loading("Clearing slot...");
        try {
            await ApiService.admin.deleteSlot(slotId);
            toast.success("Slot cleared", { id: toastId });
            router.refresh();
        } catch (e) {
            toast.error("Failed to clear slot", { id: toastId });
        }
    };

    const isSlotPhaseFull = (project: any) => {
        if (!project || project.status !== 'ACTIVE') return false;
        const raised = BigInt(project.raisedAmount || '0');
        const target = BigInt(project.targetAmount || '0');
        const activeIndex = project.currentPhaseIndex || 0;
        const budget = Array.isArray(project.budgetBreakdown) ? project.budgetBreakdown : [];

        let previousPhasesMajor = 0;
        for (let i = 0; i < activeIndex && i < budget.length; i++) {
            previousPhasesMajor += (budget[i].amount || budget[i].cost || 0);
        }
        const previousPhasesMinor = BigInt(Math.round(previousPhasesMajor * 100));

        let cumulativeMajor = previousPhasesMajor;
        if (budget[activeIndex]) {
            cumulativeMajor += (budget[activeIndex].amount || budget[activeIndex].cost || 0);
        }
        const phaseCapMinor = budget.length > 0 && activeIndex < budget.length
            ? BigInt(Math.round(cumulativeMajor * 100))
            : target;

        const currentPhaseTargetMinor = phaseCapMinor - previousPhasesMinor;
        let raisedInCurrentPhase = raised - previousPhasesMinor;
        if (raisedInCurrentPhase < 0n) raisedInCurrentPhase = 0n;

        const remainingForPhaseMinor = currentPhaseTargetMinor > raisedInCurrentPhase ? currentPhaseTargetMinor - raisedInCurrentPhase : 0n;
        return remainingForPhaseMinor < 10000n && currentPhaseTargetMinor > 0n;
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Main Settings Column */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-visible border-2">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold flex items-center gap-3 text-foreground tracking-tight">
                                    <SlidersHorizontal className="h-5 w-5 text-primary" /> Ranking Logic
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-medium">Controls how projects are scored within their category rows.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <WeightSlider
                                    label="Recency / Freshness"
                                    desc="Boost for new launches"
                                    tooltip="Critical for the new layout. Ensures the 'Top 4' preview slots rotate frequently so users don't see stale content."
                                    value={config.recencyWeight}
                                    onChange={(v) => setConfig({ ...config, recencyWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Donation Velocity"
                                    desc="Boost for active giving"
                                    tooltip="Pushes causes that are currently trending into the visible 'Top 4' preview."
                                    value={config.velocityWeight}
                                    onChange={(v) => setConfig({ ...config, velocityWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Goal Proximity"
                                    desc="Boost for nearly funded"
                                    tooltip="Prioritizes projects that are close to completion to encourage the final push."
                                    value={config.engagementWeight}
                                    onChange={(v) => setConfig({ ...config, engagementWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Manual Boost Strength"
                                    desc="Admin override power"
                                    tooltip="Determines how much your manual 'Priority Boost' slider on individual projects affects their final rank."
                                    value={config.adminWeight}
                                    onChange={(v) => setConfig({ ...config, adminWeight: parseFloat(v) })}
                                />
                            </div>

                            <div className="pt-8 border-t border-border/40 space-y-8">
                                <div className="flex flex-row items-center justify-between gap-4">
                                    <div className="flex items-start gap-4 min-w-0 flex-1">
                                        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-0.5 min-w-0 flex-1">
                                            <div className="flex items-center">
                                                <h4 className="text-sm font-bold text-foreground truncate">Show Completed Projects</h4>
                                                <SettingTooltip content="If enabled, fully funded projects will remain in the main feed rows. If disabled, they move to the 'Mission Accomplished' section or search-only." />
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                                Keep funded causes visible in category rows.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, showFundedProjects: !config.showFundedProjects })}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2",
                                            config.showFundedProjects ? "bg-primary" : "bg-muted-foreground/20"
                                        )}
                                    >
                                        <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out", config.showFundedProjects ? "translate-x-5" : "translate-x-0")} />
                                    </button>
                                </div>

                                {/* Legacy Setting: Diversity Limit */}
                                <div className="flex flex-col gap-4 pt-4 border-t border-border/10 opacity-60 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground tracking-widest uppercase">
                                        <List className="h-3 w-3" /> Legacy Search Config
                                    </div>
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-0.5 min-w-0">
                                            <div className="flex items-center">
                                                <h4 className="text-sm font-bold text-foreground truncate">Diversity Cap</h4>
                                                <SettingTooltip content="Only applies to the 'Search' and 'See All' views. Has no effect on the categorized dashboard feed." />
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium max-w-[280px]">
                                                Max duplicate categories in search results.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-2xl border border-border/40 shadow-inner w-fit">
                                            <button onClick={() => setConfig({ ...config, diversityLimit: Math.max(1, config.diversityLimit - 1) })} className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold hover:bg-muted transition-all active:scale-90">-</button>
                                            <span className="w-10 text-center font-bold text-base tabular-nums">{config.diversityLimit}</span>
                                            <button onClick={() => setConfig({ ...config, diversityLimit: Math.min(10, config.diversityLimit + 1) })} className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold hover:bg-muted transition-all active:scale-90">+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-visible">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold flex items-center text-foreground tracking-tight">
                                    <TrendingUp className="h-5 w-5 text-primary mr-3" />
                                    Category Row Order
                                    <SettingTooltip content="Controls the vertical order of categories on the dashboard. Higher weight = Higher position on the page." />
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-medium">Prioritize which sectors appear first on the feed.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                                {sortedCategories.map((cat, index) => (
                                    <motion.div
                                        layout
                                        key={cat.id}
                                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-[22px] bg-muted/20 border border-border/40 group hover:border-primary/30 transition-all shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0 flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-black text-muted-foreground border border-border/50">
                                                {index + 1}
                                            </div>
                                            <p className="text-xs font-bold text-foreground leading-tight truncate">
                                                {cat.name}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-5 w-full md:w-64">
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="5"
                                                step="0.1"
                                                value={categoryWeights[cat.id] || 1.0}
                                                onChange={(e) =>
                                                    setCategoryWeights({
                                                        ...categoryWeights,
                                                        [cat.id]: parseFloat(e.target.value),
                                                    })
                                                }
                                                className="flex-1 h-1.5 bg-border rounded-3xl appearance-none cursor-pointer accent-primary focus:outline-none"
                                            />
                                            <div className="flex flex-col items-end w-10">
                                                <span className="text-xs font-black text-primary tabular-nums">
                                                    {(categoryWeights[cat.id] || 1.0).toFixed(1)}
                                                </span>
                                                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Weight</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-center">
                        <Button
                            onClick={handleUpdateConfig}
                            disabled={isSaving}
                            className="h-12 px-8 rounded-3xl font-bold text-sm shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-0"
                        >
                            {isSaving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5 mr-2" />
                            )}
                            Save Feed Logic
                        </Button>
                    </div>
                </div>

                {/* Highlights Sidebar */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-visible h-full flex flex-col border-2">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base font-bold flex items-center text-foreground tracking-tight">
                                        <Zap className="h-5 w-5 text-amber-500 mr-3" />
                                        Featured & Pinned
                                        <SettingTooltip content="Projects pinned here will appear in the top Carousel AND be forced to position #1 in their respective category rows. Causes with fully funded phases are automatically hidden." />
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground font-medium">Manage the homepage highlights.</p>
                                </div>
                                <button
                                    className="h-9 w-9 rounded-2xl flex items-center justify-center hover:bg-muted transition-all text-muted-foreground shadow-sm bg-background border border-border/40 active:rotate-180 duration-500"
                                    onClick={() => router.refresh()}
                                    title="Refresh Slots"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-border/40">
                                <AnimatePresence mode="popLayout">
                                    {[0, 1, 2, 3, 4].map((pos) => {
                                        const slot = initialSlots.find(s => s.position === pos);
                                        const phasePaused = slot ? isSlotPhaseFull(slot.project) : false;

                                        return (
                                            <motion.div
                                                key={pos}
                                                layout
                                                className="p-6 flex items-center justify-between hover:bg-muted/[0.03] transition-colors group"
                                            >
                                                <div className="flex items-center gap-5 min-w-0">
                                                    <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-xs font-black text-muted-foreground border border-border/40 shrink-0 shadow-inner group-hover:border-primary/20 group-hover:text-primary transition-all">
                                                        {pos + 1}
                                                    </div>
                                                    <div className="min-w-0 space-y-1">
                                                        {slot ? (
                                                            <>
                                                                <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">{slot.project?.title || 'Identifying Project...'}</p>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black h-4 px-2 rounded-3xl tracking-widest shadow-none">Pinned</Badge>
                                                                    {phasePaused && (
                                                                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-black h-4 px-2 rounded-3xl tracking-widest shadow-none gap-1">
                                                                            <Clock className="h-2.5 w-2.5" /> Temporarily hidden
                                                                        </Badge>
                                                                    )}
                                                                    <span className="text-[10px] text-muted-foreground font-mono opacity-50">Ref: {slot.projectId.split('-')[0]}</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <p className="text-xs font-bold text-muted-foreground/40 italic tracking-tight">Empty Showcase Slot</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 items-center shrink-0">
                                                    {slot ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-2xl text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                                                            onClick={() => handleRemoveSlot(slot.id)}
                                                            title="Remove Highlight"
                                                        >
                                                            <Trash2 className="h-4.5 w-4.5" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-2xl text-primary hover:bg-primary/10 bg-muted/30 opacity-60 group-hover:opacity-100 transition-all border border-transparent shadow-sm active:scale-95"
                                                            onClick={() => openSelector(pos)}
                                                            title="Assign Highlight"
                                                        >
                                                            <Plus className="h-5 w-5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ProjectSelectorModal
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={handleSelectProject}
                position={activePosition || 0}
            />
        </div>
    );
});

function WeightSlider({ label, desc, tooltip, value, onChange }: { label: string, desc: string, tooltip: string, value: number, onChange: (v: string) => void }) {
    return (
        <div className="space-y-4 p-6 rounded-3xl bg-muted/20 border border-border/40 group hover:border-primary/40 transition-all shadow-inner">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center leading-none">
                        {label}
                        <SettingTooltip content={tooltip} />
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium leading-tight">{desc}</p>
                </div>
                <div className="h-7 px-3 rounded-xl bg-background border border-border/60 flex items-center justify-center shadow-sm">
                    <span className="text-xs font-black text-primary tabular-nums">{(value || 0).toFixed(1)}</span>
                </div>
            </div>
            <div className="relative flex items-center h-2">
                <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={value || 0}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-1.5 bg-border rounded-3xl appearance-none cursor-pointer accent-primary focus:outline-none"
                />
            </div>
        </div>
    );
}