'use client';

import React, { useState, memo } from 'react';
import {
    ShieldCheck,
    Zap,
    Loader2,
    Save,
    TrendingUp,
    Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Badge } from '../../../ui/badge';
import { ApiService } from '../../../../services/api';
import { cn } from '../../../../lib/utils/cn';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface ProjectVisibilityFormProps {
    project: {
        id: string;
        featureWeight: number;
        visibilityScore: number;
        moderationStatus: 'APPROVED' | 'FLAGGED' | 'HIDDEN';
    };
    globalConfig: {
        adminWeight: number;
    } | null;
}

export const ProjectVisibilityForm = memo(function ProjectVisibilityForm({ project, globalConfig }: ProjectVisibilityFormProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [data, setData] = useState({
        featureWeight: project.featureWeight,
        visibilityScore: project.visibilityScore,
        moderationStatus: project.moderationStatus,
    });

    const handleUpdate = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Updating Discovery Preferences...");
        try {
            await ApiService.admin.updateProjectWeights(project.id, data);
            toast.success("Project Visibility Settings Updated", { id: toastId });
        } catch (e) {
            toast.error("Could Not Save Visibility Changes", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 md:space-y-8 max-w-4xl"
        >
            <Card className="rounded-[32px] border-border/40 bg-card shadow-sm overflow-hidden border-2">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 tracking-widest text-foreground ">
                                <ShieldCheck className="h-4 w-4 text-primary" /> Discovery Visibility
                            </CardTitle>
                            <p className="text-[11px] text-muted-foreground font-bold tracking-widest ">Visibility Controls</p>
                        </div>
                        <Badge variant="outline" className={cn(
                            "rounded-3xl px-3 py-1 font-bold text-[10px] tracking-widest border ",
                            data.moderationStatus === 'APPROVED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                data.moderationStatus === 'FLAGGED' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-destructive/5 text-destructive border-destructive/10"
                        )}>
                            {data.moderationStatus}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 space-y-10">

                    <div className="space-y-3">
                        <label className="text-[11px] font-bold tracking-widest text-muted-foreground ml-1 ">Safety Settings</label>
                        <Select
                            value={data.moderationStatus}
                            onValueChange={(v: any) => setData(prev => ({ ...prev, moderationStatus: v }))}
                        >
                            <SelectTrigger className="h-12 rounded-2xl bg-muted/20 border-border/40 font-bold text-sm transition-all focus:bg-background shadow-inner">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl shadow-xl border-border/40">
                                <SelectItem value="APPROVED" className="font-bold text-xs py-2.5">Approved (Show In Feed)</SelectItem>
                                <SelectItem value="FLAGGED" className="font-bold text-xs py-2.5 text-amber-600">Flagged (Limit Visibility)</SelectItem>
                                <SelectItem value="HIDDEN" className="font-bold text-xs py-2.5 text-destructive">Hidden (Remove From Feed)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4 p-6 rounded-3xl bg-muted/20 border border-border/40 group hover:border-primary/30 transition-all shadow-inner">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold tracking-widest text-foreground flex items-center gap-2 ">
                                        <Zap className="h-3.5 w-3.5 text-amber-500" /> Featured Weight
                                    </label>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-tight">Priority boost for the featured carousel.</p>
                                </div>
                                <span className="text-sm font-black text-primary tabular-nums">{data.featureWeight}</span>
                            </div>
                            <input
                                type="range" min="0" max="100" step="1"
                                value={data.featureWeight}
                                onChange={(e) => setData(prev => ({ ...prev, featureWeight: parseInt(e.target.value) }))}
                                className="w-full h-1.5 bg-border rounded-3xl appearance-none cursor-pointer accent-primary focus:outline-none"
                            />
                        </div>

                        <div className="space-y-4 p-6 rounded-3xl bg-muted/20 border border-border/40 group hover:border-blue-500/30 transition-all shadow-inner">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold tracking-widest text-foreground flex items-center gap-2 ">
                                        <TrendingUp className="h-3.5 w-3.5 text-blue-500" /> Priority Boost
                                    </label>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-tight">Manual scoring bonus for trending lists.</p>
                                </div>
                                <span className="text-sm font-black text-blue-600 tabular-nums">+{data.visibilityScore.toFixed(1)}</span>
                            </div>
                            <input
                                type="range" min="0" max="50" step="0.5"
                                value={data.visibilityScore}
                                onChange={(e) => setData(prev => ({ ...prev, visibilityScore: parseFloat(e.target.value) }))}
                                className="w-full h-1.5 bg-border rounded-3xl appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-blue-50/50 border border-blue-100 flex items-start gap-4">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-blue-700 font-bold tracking-tight leading-relaxed">
                            Platform Rule: Higher weights increase the likelihood of this cause appearing first to new givers. Settings are applied instantly.
                        </p>
                    </div>

                    <Button
                        onClick={handleUpdate}
                        disabled={isSaving}
                        className="w-full h-14 rounded-3xl font-bold tracking-widest text-xs shadow-xl shadow-primary/20 transition-all active:scale-[0.98] border-0"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                        Apply Visibility Settings
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );
});