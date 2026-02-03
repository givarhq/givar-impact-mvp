'use client';

import React, { useState } from 'react';
import { Lock, Unlock, Shield, X, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface BulkActionsToolbarProps {
    selectedIds: string[];
    onClear: () => void;
}

export function BulkActionsToolbar({ selectedIds, onClear }: BulkActionsToolbarProps) {
    const router = useRouter();
    const [isBusy, setIsBusy] = useState(false);

    if (selectedIds.length === 0) return null;

    const handleBulkAction = async (action: 'LOCK' | 'UNLOCK' | 'SET_USER' | 'SET_ADMIN') => {
        const confirmMsg = `Apply ${action.replace('_', ' ')} to ${selectedIds.length} users? This procedure is forensic and irreversible.`;
        if (!confirm(confirmMsg)) return;

        setIsBusy(true);
        try {
            await ApiService.admin.bulkUpdateUsers({ userIds: selectedIds, action });
            toast.success(`Batch execution sequence successful.`);
            onClear();
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Batch operation failure.");
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-20 duration-700 w-fit max-w-[98vw] px-2">
            <div className="bg-zinc-950/95 text-white rounded-full shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] p-1.5 flex items-center border border-white/10 backdrop-blur-2xl ring-1 ring-white/5">

                {/* 1. Forensic Selection Stats - Standardized Padding */}
                <div className="flex items-center gap-3 border-r border-white/10 pl-4 pr-4 shrink-0">
                    <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-[14px] font-black text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                        {selectedIds.length}
                    </div>
                    <div className="flex flex-col leading-tight">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-200">Selected</span>
                        <span className="text-[8px] font-bold text-zinc-500 uppercase">Forensic batch</span>
                    </div>
                </div>

                {/* 2. Action Hub - Gaps minimized to 0.5 for ultra-density */}
                <div className="flex items-center gap-0.5 shrink-0 px-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 rounded-full hover:bg-destructive/20 text-white hover:text-white font-bold text-[9px] uppercase tracking-widest px-3 border-none"
                        onClick={() => handleBulkAction('LOCK')}
                        disabled={isBusy}
                    >
                        <Lock className="h-3.5 w-3.5 text-destructive" />
                        <span className="hidden sm:inline">Lock</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 rounded-full hover:bg-emerald-500/10 text-white hover:text-white font-bold text-[9px] uppercase tracking-widest px-3 border-none"
                        onClick={() => handleBulkAction('UNLOCK')}
                        disabled={isBusy}
                    >
                        <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="hidden sm:inline">Unlock</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 rounded-full hover:bg-blue-500/10 text-white hover:text-white font-bold text-[9px] uppercase tracking-widest px-3 border-none"
                        onClick={() => handleBulkAction('SET_ADMIN')}
                        disabled={isBusy}
                    >
                        <Shield className="h-3.5 w-3.5 text-blue-400" />
                        <span className="hidden sm:inline">Admin</span>
                    </Button>
                </div>

                {/* 3. Termination Control - Perfectly centered in its own cell */}
                <div className="flex items-center shrink-0 border-l border-white/10 pl-1.5 pr-1.5">
                    <button
                        onClick={onClear}
                        className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-all text-zinc-400 hover:text-white group"
                        title="Discard Selection"
                    >
                        {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <X className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}