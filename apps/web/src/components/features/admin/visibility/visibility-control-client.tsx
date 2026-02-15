'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Zap, Trash2, Plus,
    Loader2, Save, ShieldCheck, RefreshCw,
    Info, SlidersHorizontal, LayoutGrid
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { ApiService } from '../../../../services/api';
import { Project } from '../../../../types';
import { ProjectSelectorModal } from './project-selector-modal';
import toast from 'react-hot-toast';

interface VisibilityControlProps {
    initialConfig: {
        id: string;
        recencyWeight: number;
        velocityWeight: number;
        engagementWeight: number;
        adminWeight: number;
        diversityLimit: number;
    };
    initialSlots: any[];
    categories: any[];
}

export function VisibilityControlClient({ initialConfig, initialSlots, categories }: VisibilityControlProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [config, setConfig] = useState(initialConfig);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [activePosition, setActivePosition] = useState<number | null>(null);

    // 1. Algorithmic Weight Persistence
    const handleUpdateConfig = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Broadcasting ledger discovery updates...");
        try {
            await ApiService.admin.updateConfig(config);
            toast.success("Discovery variables synchronized", { id: toastId });
            router.refresh();
        } catch (e: any) {
            const message = e.response?.data?.message || "Protocol update failed";
            toast.error(message, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    // 2. Slot Selection Management
    const openSelector = (position: number) => {
        setActivePosition(position);
        setIsSelectorOpen(true);
    };

    const handleSelectProject = async (project: Project) => {
        if (activePosition === null) return;

        const toastId = toast.loading(`Assigning ${project.title} to Slot ${activePosition + 1}...`);
        try {
            await ApiService.admin.createSlot({
                projectId: project.id,
                position: activePosition
            });
            toast.success("Featured position updated on-chain", { id: toastId });
            setIsSelectorOpen(false);
            router.refresh();
        } catch (e) {
            toast.error("Slot allocation rejected", { id: toastId });
        }
    };

    // 3. Slot Deletion Protocol
    const handleRemoveSlot = async (slotId: string) => {
        const toastId = toast.loading("De-allocating discovery slot...");
        try {
            await ApiService.admin.deleteSlot(slotId);
            toast.success("Slot released successfully", { id: toastId });
            router.refresh();
        } catch (e) {
            toast.error("Action failed", { id: toastId });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- LEFT COLUMN: ALGORITHMIC VARIABLES --- */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="rounded-[32px] border-border/40 bg-card shadow-sm overflow-hidden border-2">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-[0.2em] text-foreground">
                                        <SlidersHorizontal className="h-4 w-4 text-primary" /> Discovery Variables
                                    </CardTitle>
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Weights & Scaling</p>
                                </div>
                                <Badge variant="outline" className="rounded-3xl font-mono text-[10px] bg-background border-border/60">v2.1_FORENSIC</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 md:p-8 space-y-10">
                            {/* Weight Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                                <WeightSlider
                                    label="Recency Decay"
                                    desc="Priority multiplier for fresh causes"
                                    value={config.recencyWeight}
                                    onChange={(v) => setConfig({ ...config, recencyWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Donation Velocity"
                                    desc="Priority for high 7-day frequency"
                                    value={config.velocityWeight}
                                    onChange={(v) => setConfig({ ...config, velocityWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Engagement Signal"
                                    desc="Social & update interaction weight"
                                    value={config.engagementWeight}
                                    onChange={(v) => setConfig({ ...config, engagementWeight: parseFloat(v) })}
                                />
                                <WeightSlider
                                    label="Administrative Weight"
                                    desc="Multiplier for manual featureWeight"
                                    value={config.adminWeight}
                                    onChange={(v) => setConfig({ ...config, adminWeight: parseFloat(v) })}
                                />
                            </div>

                            {/* Diversity Configuration */}
                            <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                                        <LayoutGrid className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-foreground">Diversity Constraint</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed max-w-[280px]">
                                            Maximum projects from a single category allowed in the top discovery results.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-2xl border border-border/40">
                                    <button
                                        onClick={() => setConfig({ ...config, diversityLimit: Math.max(1, config.diversityLimit - 1) })}
                                        className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold hover:bg-muted active:scale-95 transition-all"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center font-black text-lg tabular-nums">{config.diversityLimit}</span>
                                    <button
                                        onClick={() => setConfig({ ...config, diversityLimit: Math.min(10, config.diversityLimit + 1) })}
                                        className="h-8 w-8 rounded-xl bg-background border border-border/60 flex items-center justify-center font-bold hover:bg-muted active:scale-95 transition-all"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <Button
                                onClick={handleUpdateConfig}
                                disabled={isSaving}
                                className="w-full h-14 rounded-3xl font-black tracking-[0.2em] uppercase text-xs shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-0"
                            >
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Commit Global Logic
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="p-6 rounded-[32px] bg-amber-50 border border-dashed border-amber-200 flex items-start gap-4 shadow-sm animate-in zoom-in-95 duration-500">
                        <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-amber-900 uppercase tracking-widest">Protocol Notice</p>
                            <p className="text-xs text-amber-800/80 leading-relaxed font-medium">
                                Modifying weights will trigger an instant cache invalidation. Discovery results for all guest and registered users will shift immediately based on the new weighted score.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: PINNED CONTENT --- */}
                <div className="lg:col-span-5 space-y-6">
                    <Card className="rounded-[32px] border-border/40 bg-card shadow-sm overflow-hidden h-full flex flex-col border-2">
                        <CardHeader className="bg-muted/30 border-b border-border/40 p-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-[0.2em] text-foreground">
                                        <Zap className="h-4 w-4 text-amber-500" /> Carousel Pins
                                    </CardTitle>
                                    <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">Manual Slot Control</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl hover:bg-background border border-transparent hover:border-border/40"
                                    onClick={() => router.refresh()}
                                >
                                    <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1">
                            <div className="divide-y divide-border/40">
                                {[0, 1, 2, 3, 4].map((pos) => {
                                    const slot = initialSlots.find(s => s.position === pos);
                                    return (
                                        <div key={pos} className="p-6 flex items-center justify-between hover:bg-muted/[0.02] transition-colors group">
                                            <div className="flex items-center gap-5 min-w-0">
                                                <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-xs font-black text-muted-foreground border border-border/40 shrink-0 shadow-inner group-hover:bg-background transition-colors">
                                                    {pos + 1}
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    {slot ? (
                                                        <>
                                                            <p className="text-sm font-bold text-foreground truncate leading-tight">{slot.project.title}</p>
                                                            <div className="flex items-center gap-2">
                                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black h-4 px-1.5 rounded-3xl tracking-widest">PINNED</Badge>
                                                                <span className="text-[10px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded-3xl border border-border/40 truncate">id: {slot.project.id.split('-')[0]}</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-xs font-medium text-muted-foreground italic opacity-60">Slot available for content injection</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-center shrink-0">
                                                {slot ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-2xl text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/10"
                                                        onClick={() => handleRemoveSlot(slot.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-2xl text-primary hover:bg-primary/10 bg-muted/20 opacity-40 group-hover:opacity-100 transition-all border border-transparent hover:border-primary/20 shadow-sm"
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
                        <div className="p-6 bg-muted/10 border-t border-border/40">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <Info className="h-3 w-3 text-primary" /> Max 5 slots active per period
                            </p>
                        </div>
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
        <div className="space-y-4 p-5 rounded-3xl bg-muted/20 border border-border/40 group hover:border-primary/20 hover:bg-muted/30 transition-all">
            <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                    <label className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground group-hover:text-primary transition-colors block">
                        {label}
                    </label>
                    <p className="text-[10px] text-muted-foreground font-bold tracking-tight">{desc}</p>
                </div>
                <div className="h-8 px-2.5 rounded-2xl bg-background border border-border/60 flex items-center justify-center shadow-sm">
                    <span className="text-xs font-black text-primary tabular-nums">{(value || 0).toFixed(1)}</span>
                </div>
            </div>
            <div className="relative flex items-center h-4">
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