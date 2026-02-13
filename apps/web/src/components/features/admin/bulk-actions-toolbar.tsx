'use client';

import React, { useState, useEffect } from 'react';
import {
    Lock, Unlock, Shield, X, Loader2, ShieldOff,
    PlayCircle, Ban, Trash2, CheckCircle2
} from 'lucide-react';
import { Button } from '../../ui/button';
import { ConfirmModal } from '../../ui/confirm-modal';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';

interface BulkActionsToolbarProps {
    selectedIds: string[];
    onClear: () => void;
    context?: 'USER' | 'PROJECT' | 'PROPOSAL';
}

export function BulkActionsToolbar({ selectedIds, onClear, context = 'USER' }: BulkActionsToolbarProps) {
    const router = useRouter();
    const [isBusy, setIsBusy] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        action: string | null
    }>({
        isOpen: false,
        action: null,
    });

    useEffect(() => {
        const cookie = getCookie('givar_user');
        if (cookie) {
            try {
                const user = JSON.parse(cookie as string);
                setUserRole(user.role);
            } catch (e) { }
        }
    }, []);

    const isSuperAdmin = userRole === 'SUPERADMIN';

    if (selectedIds.length === 0) return null;

    const handleActionClick = (action: string) => {
        setConfirmConfig({ isOpen: true, action });
    };

    const executeBulkAction = async () => {
        const action = confirmConfig.action;
        if (!action) return;

        setIsBusy(true);
        try {
            if (context === 'USER') {
                await ApiService.admin.bulkUpdateUsers({ userIds: selectedIds, action: action as any });
            } else if (context === 'PROJECT') {
                await ApiService.admin.bulkUpdateProjects({ projectIds: selectedIds, action: action as any });
            } else if (context === 'PROPOSAL') {
                await ApiService.admin.bulkUpdateProposals({ proposalIds: selectedIds, action: action as any });
            }

            toast.success(`Batch operation successful`);
            setConfirmConfig({ isOpen: false, action: null });
            onClear();
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Batch failure");
        } finally {
            setIsBusy(false);
        }
    };

    const getActionMeta = (action: string | null): { title: string; desc: string; variant: "default" | "destructive" | "warning" } => {
        if (!action) return { title: '', desc: '', variant: 'default' };
        const count = selectedIds.length;

        // 1. User Context Logic
        if (context === 'USER') {
            const label = action.replace('SET_', '').replace('_', ' ').toLowerCase();
            let variant: "default" | "destructive" | "warning" = 'default';
            if (action === 'LOCK') variant = 'destructive';
            if (action === 'SET_ADMIN') variant = 'warning';
            if (action === 'SET_USER') variant = 'destructive';
            return {
                title: `Confirm batch ${label}`,
                desc: `Apply ${label} status to ${count} selected accounts?`,
                variant
            };
        }

        // 2. Project Context Logic
        if (context === 'PROJECT') {
            let variant: "default" | "destructive" | "warning" = 'default';
            if (action === 'DELETE') variant = 'destructive';
            if (action === 'SUSPEND') variant = 'warning';
            return {
                title: `Batch ${action.toLowerCase()}`,
                desc: `Apply ${action.toLowerCase()} to ${count} projects? This is recorded in the audit trail.`,
                variant
            };
        }

        // 3. Proposal Context Logic
        if (context === 'PROPOSAL') {
            let variant: "default" | "destructive" | "warning" = 'default';
            if (action === 'REJECT') variant = 'destructive';
            return {
                title: `Batch ${action.toLowerCase()}`,
                desc: `Perform bulk ${action.toLowerCase()} on ${count} proposals?`,
                variant
            };
        }

        return { title: 'Confirm Action', desc: `Proceed with ${action} for ${count} items?`, variant: 'default' };
    };

    const renderActions = () => {
        if (context === 'USER') {
            return (
                <>
                    <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-destructive/20 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('LOCK')} disabled={isBusy}>
                        <Lock className="h-3.5 w-3.5 mr-1.5 text-destructive" /> Lock
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-emerald-500/10 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('UNLOCK')} disabled={isBusy}>
                        <Unlock className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Unlock
                    </Button>
                    {isSuperAdmin && (
                        <>
                            <div className="w-px h-5 bg-white/10 mx-1" />
                            <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-blue-500/10 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('SET_ADMIN')} disabled={isBusy}>
                                <Shield className="h-3.5 w-3.5 mr-1.5 text-blue-400" /> Promote
                            </Button>
                            <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-amber-500/10 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('SET_USER')} disabled={isBusy}>
                                <ShieldOff className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> Demote
                            </Button>
                        </>
                    )}
                </>
            );
        }

        if (context === 'PROJECT') {
            return (
                <>
                    <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-emerald-500/10 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('ACTIVATE')} disabled={isBusy}>
                        <PlayCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Activate
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-amber-500/10 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('SUSPEND')} disabled={isBusy}>
                        <Ban className="h-3.5 w-3.5 mr-1.5 text-amber-500" /> Suspend
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-destructive/20 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('DELETE')} disabled={isBusy}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5 text-destructive" /> Delete
                    </Button>
                </>
            );
        }

        if (context === 'PROPOSAL') {
            return (
                <>
                    <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-emerald-500/10 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('APPROVE')} disabled={isBusy}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Approve
                    </Button>
                    <Button variant="ghost" size="sm" className="h-9 rounded-3xl text-white hover:text-white hover:bg-destructive/20 font-bold text-xs uppercase tracking-wider px-3" onClick={() => handleActionClick('REJECT')} disabled={isBusy}>
                        <X className="h-3.5 w-3.5 mr-1.5 text-destructive" /> Reject
                    </Button>
                </>
            );
        }
    };

    const meta = getActionMeta(confirmConfig.action);

    return (
        <>
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-8 duration-300 w-fit max-w-[95vw]">
                <div className="bg-zinc-950 text-white rounded-3xl shadow-2xl p-1.5 flex items-center border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-3 border-r border-white/10 pl-4 pr-3 shrink-0">
                        <div className="h-8 w-8 rounded-3xl bg-primary flex items-center justify-center text-xs font-bold text-black">
                            {selectedIds.length}
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Batch</span>
                            <span className="text-xs font-medium text-zinc-500">selected</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 px-1 shrink-0">
                        {renderActions()}
                    </div>

                    <div className="flex items-center shrink-0 border-l border-white/10 pl-1">
                        <button onClick={onClear} className="h-8 w-8 rounded-3xl hover:bg-white/10 flex items-center justify-center transition-all text-zinc-400 hover:text-white" title="Discard">
                            {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ isOpen: false, action: null })}
                onConfirm={executeBulkAction}
                isLoading={isBusy}
                variant={meta.variant}
                title={meta.title}
                description={meta.desc}
                confirmText="Execute"
            />
        </>
    );
}