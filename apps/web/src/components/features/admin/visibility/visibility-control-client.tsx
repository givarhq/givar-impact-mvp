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

export const VisibilityControlClient = memo(function VisibilityControlClient({ initialConfig, initialSlots, categories }: VisibilityControlProps) {
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
        const toastId = toast.loading("Updating Discovery Algorithm...");
        try {
            await Promise.all([
                ApiService.admin.updateConfig(config),
                ...Object.entries(categoryWeights).map(([id, weight]) =>
                    ApiService.admin.updateCategoryWeight(id, weight)
                )
            ]);
            toast.success("Discovery Settings Synchronized", { id: toastId });
            router.refresh();
        } catch (e: any) {
            toast.error("Failed To Update Discovery Logic", { id: toastId });
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
        const toastId = toast.loading(`Highlighting ${project.title}...`);
        try {
            await ApiService.admin.createSlot({
                projectId: project.id,
                position: activePosition
            });
            toast.success("Project Added To Featured Highlights", { id: toastId });
            setIsSelectorOpen(false);
            router.refresh();
        } catch (e) {
            toast.error("Could Not Update Highlights", { id: toastId });
        }
    };

    const handleRemoveSlot = async (slotId: string) => {
        const toastId = toast.loading("Removing Highlight...");
        try {
            await ApiService.admin.deleteSlot(slotId);
            toast.success("Featured Slot Cleared", { id: toastId });
            router.refresh();
        } catch (e) {
            toast.error("Failed To Remove Highlight", { id: toastId });
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Main Settings Column */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden border-2">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold flex items-center gap-3 text-foreground tracking-tight">
                                    <SlidersHorizontal className="h-5 w-5 text-primary" /> Discovery Settings
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-medium">Fine-tune the recommendation engine for all givers.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <WeightSlider
                                    label="New Project Priority"
                                    desc="Boost for recently launched causes"
                                    value={config.recencyWeight}
                                    onChange={(v) => setConfig({ ...config, recencyWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Donation Momentum"
                                    desc="Boost for high-frequency giving"
                                    value={config.velocityWeight}
                                    onChange={(v) => setConfig({ ...config, velocityWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Community Interest"
                                    desc="Boost based on page engagement"
                                    value={config.engagementWeight}
                                    onChange={(v) => setConfig({ ...config, engagementWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Staff Priority"
                                    desc="Boost for hand-picked initiatives"
                                    value={config.adminWeight}
                                    onChange={(v) => setConfig({ ...config, adminWeight: parseFloat(v) })}
                                />
                            </div>

                            <div className="pt-8 border-t border-border/40 space-y-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <h4 className="text-sm font-bold text-foreground truncate">Show Completed Projects</h4>
                                            <p className="text-xs text-muted-foreground font-medium max-w-[280px]">
                                                Display successfully funded projects in the public discovery feed.
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
                                        <span
                                            className={cn(
                                                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                                config.showFundedProjects ? "translate-x-5" : "translate-x-0"
                                            )}
                                        />
                                    </button>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-8 border-t border-border/10">
                                    <div className="flex items-start gap-4 min-w-0">
                                        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                                            <LayoutGrid className="h-6 w-6" />
                                        </div>
                                        <div className="space-y-0.5 min-w-0">
                                            <h4 className="text-sm font-bold text-foreground truncate">Cause Variety Limit</h4>
                                            <p className="text-xs text-muted-foreground font-medium max-w-[280px]">
                                                Maximum projects shown per sector to maintain a diverse feed.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-muted/40 p-1.5 rounded-2xl border border-border/40 shadow-inner">
                                        <button
                                            onClick={() => setConfig({ ...config, diversityLimit: Math.max(1, config.diversityLimit - 1) })}
                                            className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold hover:bg-muted transition-all shadow-sm active:scale-90"
                                        >
                                            -
                                        </button>
                                        <span className="w-10 text-center font-bold text-base tabular-nums">{config.diversityLimit}</span>
                                        <button
                                            onClick={() => setConfig({ ...config, diversityLimit: Math.min(10, config.diversityLimit + 1) })}
                                            className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold hover:bg-muted transition-all shadow-sm active:scale-90"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-bold flex items-center gap-3 text-foreground tracking-tight">
                                    <TrendingUp className="h-5 w-5 text-primary" /> Sector Boosting
                                </CardTitle>
                                <p className="text-xs text-muted-foreground font-medium">Prioritize entire impact categories globally.</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8">
                            <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-[22px] bg-muted/20 border border-border/40 group hover:border-primary/30 transition-all shadow-sm"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-foreground leading-tight truncate">
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
                                            <span className="text-xs font-black text-primary tabular-nums w-10 text-right">
                                                {(categoryWeights[cat.id] || 1.0).toFixed(1)}x
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        onClick={handleUpdateConfig}
                        disabled={isSaving}
                        className="w-full h-14 rounded-3xl font-bold text-sm tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-0"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                        Commit Algorithm Updates
                    </Button>
                </div>

                {/* Highlights Sidebar */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden h-full flex flex-col border-2">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <CardTitle className="text-base font-bold flex items-center gap-3 text-foreground tracking-tight">
                                        <Zap className="h-5 w-5 text-amber-500" /> Featured Highlights
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
                                                                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{slot.project?.title || 'Identifying Project...'}</p>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black h-4 px-2 rounded-3xl tracking-widest  shadow-none">Pinned</Badge>
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

function WeightSlider({ label, desc, value, onChange }: { label: string, desc: string, value: number, onChange: (v: string) => void }) {
    return (
        <div className="space-y-4 p-6 rounded-3xl bg-muted/20 border border-border/40 group hover:border-primary/40 transition-all shadow-inner">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block leading-none">
                        {label}
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