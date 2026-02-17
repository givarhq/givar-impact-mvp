'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Zap, Trash2, Plus,
    Loader2, Save, ShieldCheck, RefreshCw,
    SlidersHorizontal, LayoutGrid,
    TrendingUp,
    CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { ApiService } from '../../../../services/api';
import { Project } from '../../../../types';
import { ProjectSelectorModal } from './project-selector-modal';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils/cn';

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

export function VisibilityControlClient({ initialConfig, initialSlots, categories }: VisibilityControlProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState(initialConfig);
    const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>(
        categories.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.visibilityWeight || 1.0 }), {})
    );
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [activePosition, setActivePosition] = useState<number | null>(null);

    const handleUpdateConfig = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Updating discovery algorithm...");
        try {
            await Promise.all([
                ApiService.admin.updateConfig(config),
                ...Object.entries(categoryWeights).map(([id, weight]) =>
                    ApiService.admin.updateCategoryWeight(id, weight)
                )
            ]);
            toast.success("Discovery logic updated", { id: toastId });
            router.refresh();
        } catch (e: any) {
            toast.error("Failed to update logic", { id: toastId });
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
            toast.success("Project pinned to carousel", { id: toastId });
            setIsSelectorOpen(false);
            router.refresh();
        } catch (e) {
            toast.error("Failed to update slot", { id: toastId });
        }
    };

    const handleRemoveSlot = async (slotId: string) => {
        const toastId = toast.loading("Removing pin...");
        try {
            await ApiService.admin.deleteSlot(slotId);
            toast.success("Slot cleared", { id: toastId });
            router.refresh();
        } catch (e) {
            toast.error("Action failed", { id: toastId });
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Discovery control column */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="rounded-[32px] border-border/40 bg-card shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                        <SlidersHorizontal className="h-4 w-4 text-primary" /> Discovery variables
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground font-medium">Algorithmic weights and scaling</p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <WeightSlider
                                    label="Recency decay"
                                    desc="Priority for newer causes"
                                    value={config.recencyWeight}
                                    onChange={(v) => setConfig({ ...config, recencyWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Donation velocity"
                                    desc="Priority for high frequency"
                                    value={config.velocityWeight}
                                    onChange={(v) => setConfig({ ...config, velocityWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Engagement signal"
                                    desc="Social interaction weight"
                                    value={config.engagementWeight}
                                    onChange={(v) => setConfig({ ...config, engagementWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Admin weight"
                                    desc="Manual priority multiplier"
                                    value={config.adminWeight}
                                    onChange={(v) => setConfig({ ...config, adminWeight: parseFloat(v) })}
                                />
                            </div>

                            <div className="pt-8 border-t border-border/40 space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-foreground">Funded visibility</h4>
                                            <p className="text-xs text-muted-foreground font-medium max-w-[280px]">
                                                Show completed projects in the user discovery feed.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, showFundedProjects: !config.showFundedProjects })}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                                            config.showFundedProjects ? "bg-primary" : "bg-muted-foreground/20"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                config.showFundedProjects ? "translate-x-5" : "translate-x-0"
                                            )}
                                        />
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8 border-t border-border/10">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <LayoutGrid className="h-5 w-5" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h4 className="text-sm font-bold text-foreground">Diversity constraint</h4>
                                            <p className="text-xs text-muted-foreground font-medium max-w-[280px]">
                                                Maximum projects per category in results.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-muted/20 p-1.5 rounded-2xl border border-border/40">
                                        <button
                                            onClick={() => setConfig({ ...config, diversityLimit: Math.max(1, config.diversityLimit - 1) })}
                                            className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold hover:bg-muted transition-all"
                                        >
                                            -
                                        </button>
                                        <span className="w-10 text-center font-bold text-base tabular-nums">{config.diversityLimit}</span>
                                        <button
                                            onClick={() => setConfig({ ...config, diversityLimit: Math.min(10, config.diversityLimit + 1) })}
                                            className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold hover:bg-muted transition-all"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[32px] border-border/40 bg-card shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                            <div className="space-y-0.5">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                    <TrendingUp className="h-4 w-4 text-primary" /> Sector prioritization
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-medium">Global multipliers for impact categories</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar pr-2">
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl bg-muted/10 border border-border/40 group hover:border-primary/20 transition-all"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-bold text-foreground leading-snug break-words">
                                                {cat.name}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 w-full md:w-56">
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
                                                className="flex-1 h-1 bg-border rounded-3xl appearance-none cursor-pointer accent-primary focus:outline-none"
                                            />
                                            <span className="text-xs font-bold text-primary tabular-nums w-10 text-right">
                                                {(categoryWeights[cat.id] || 1.0).toFixed(1)}x
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-5 rounded-[32px] bg-primary/5 border border-dashed border-primary/20 flex items-start gap-3 shadow-sm">
                        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-primary  tracking-tight">Consensus sync</p>
                            <p className="text-xs text-primary/70 font-medium leading-relaxed">
                                Committing changes will recalculate the discovery score for all causes. Pinned positions remain locked.
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={handleUpdateConfig}
                        disabled={isSaving}
                        className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Commit discovery logic
                    </Button>
                </div>

                {/* Carousel pins column */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-[32px] border-border/40 bg-card shadow-sm overflow-hidden h-full flex flex-col">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                        <Zap className="h-4 w-4 text-amber-500" /> Carousel pins
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground font-medium">Manual position control</p>
                                </div>
                                <button
                                    className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-muted transition-all text-muted-foreground"
                                    onClick={() => router.refresh()}
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-border/40">
                                {[0, 1, 2, 3, 4].map((pos) => {
                                    const slot = initialSlots.find(s => s.position === pos);
                                    return (
                                        <div key={pos} className="p-5 flex items-center justify-between hover:bg-muted/[0.02] transition-colors group">
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="h-9 w-9 rounded-2xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground border border-border/40 shrink-0 shadow-inner">
                                                    {pos + 1}
                                                </div>
                                                <div className="min-w-0 space-y-0.5">
                                                    {slot ? (
                                                        <>
                                                            <p className="text-sm font-bold text-foreground truncate">{slot.project?.title || 'Unknown project'}</p>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-bold h-4 px-2 rounded-3xl">PINNED</Badge>
                                                                <span className="text-[10px] text-muted-foreground font-mono">#{slot.projectId.split('-')[0]}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-xs font-medium text-muted-foreground italic opacity-60">Empty position</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-center shrink-0">
                                                {slot ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-2xl text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemoveSlot(slot.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-2xl text-primary hover:bg-primary/10 bg-muted/20 opacity-40 group-hover:opacity-100 transition-all border border-transparent shadow-sm"
                                                        onClick={() => openSelector(pos)}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
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
}

function WeightSlider({ label, desc, value, onChange }: { label: string, desc: string, value: number, onChange: (v: string) => void }) {
    return (
        <div className="space-y-4 p-5 rounded-3xl bg-muted/20 border border-border/40 group hover:border-primary/20 transition-all">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                    <label className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block">
                        {label}
                    </label>
                    <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
                </div>
                <div className="h-7 px-2 rounded-2xl bg-background border border-border/60 flex items-center justify-center shadow-sm">
                    <span className="text-xs font-bold text-primary tabular-nums">{(value || 0).toFixed(1)}</span>
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