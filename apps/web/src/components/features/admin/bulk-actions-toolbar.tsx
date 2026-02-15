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

    const getActionMeta = (
        action: string | null
    ): { title: string; desc: string; variant: "default" | "destructive" | "warning" } => {
        if (!action) return { title: '', desc: '', variant: 'default' };
        const count = selectedIds.length;

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

        if (context === 'PROPOSAL') {
            let variant: "default" | "destructive" | "warning" = 'default';
            if (action === 'REJECT') variant = 'destructive';
            return {
                title: `Batch ${action.toLowerCase()}`,
                desc: `Perform bulk ${action.toLowerCase()} on ${count} proposals?`,
                variant
            };
        }

        return {
            title: 'Confirm Action',
            desc: `Proceed with ${action} for ${count} items?`,
            variant: 'default'
        };
    };

    const baseBtn =
        "h-10 sm:h-9 rounded-3xl text-white font-bold text-xs uppercase tracking-wider px-3 sm:px-3 snap-start";

    const renderActions = () => {
        if (context === 'USER') {
            return (
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${baseBtn} hover:text-white hover:bg-destructive/20`}
                        onClick={() => handleActionClick('LOCK')}
                        disabled={isBusy}
                    >
                        <Lock className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-destructive" />
                        <span className="hidden sm:inline">Lock</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${baseBtn} hover:text-white hover:bg-emerald-500/10`}
                        onClick={() => handleActionClick('UNLOCK')}
                        disabled={isBusy}
                    >
                        <Unlock className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-emerald-500" />
                        <span className="hidden sm:inline">Unlock</span>
                    </Button>

                    {isSuperAdmin && (
                        <>
                            <div className="w-px h-5 bg-white/10 mx-1 hidden sm:block" />

                            <Button
                                variant="ghost"
                                size="sm"
                                className={`${baseBtn} hover:text-white hover:bg-blue-500/10`}
                                onClick={() => handleActionClick('SET_ADMIN')}
                                disabled={isBusy}
                            >
                                <Shield className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-blue-400" />
                                <span className="hidden sm:inline">Promote</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className={`${baseBtn} hover:text-white hover:bg-amber-500/10`}
                                onClick={() => handleActionClick('SET_USER')}
                                disabled={isBusy}
                            >
                                <ShieldOff className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-amber-500" />
                                <span className="hidden sm:inline">Demote</span>
                            </Button>
                        </>
                    )}
                </>
            );
        }

        if (context === 'PROJECT') {
            return (
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${baseBtn} hover:text-white hover:bg-emerald-500/10`}
                        onClick={() => handleActionClick('ACTIVATE')}
                        disabled={isBusy}
                    >
                        <PlayCircle className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-emerald-500" />
                        <span className="hidden sm:inline">Activate</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${baseBtn} hover:text-white hover:bg-amber-500/10`}
                        onClick={() => handleActionClick('SUSPEND')}
                        disabled={isBusy}
                    >
                        <Ban className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-amber-500" />
                        <span className="hidden sm:inline">Suspend</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${baseBtn} hover:text-white hover:bg-destructive/20`}
                        onClick={() => handleActionClick('DELETE')}
                        disabled={isBusy}
                    >
                        <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-destructive" />
                        <span className="hidden sm:inline">Delete</span>
                    </Button>
                </>
            );
        }

        if (context === 'PROPOSAL') {
            return (
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${baseBtn} hover:text-white hover:bg-emerald-500/10`}
                        onClick={() => handleActionClick('APPROVE')}
                        disabled={isBusy}
                    >
                        <CheckCircle2 className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-emerald-500" />
                        <span className="hidden sm:inline">Approve</span>
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className={`${baseBtn} hover:text-white hover:bg-destructive/20`}
                        onClick={() => handleActionClick('REJECT')}
                        disabled={isBusy}
                    >
                        <X className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5 text-destructive" />
                        <span className="hidden sm:inline">Reject</span>
                    </Button>
                </>
            );
        }
    };

    const meta = getActionMeta(confirmConfig.action);

    return (
        <>
            <div className="fixed bottom-4 sm:bottom-20 left-1/2 -translate-x-1/2 z-[60] w-[95vw] sm:w-fit max-w-[95vw] animate-in slide-in-from-bottom-8 duration-300">
                <div className="bg-zinc-950 text-white rounded-3xl shadow-2xl p-1 sm:p-1.5 flex items-center border border-white/10 backdrop-blur-2xl sm:backdrop-blur-xl">

                    <div className="flex items-center gap-2 sm:gap-3 border-r border-white/10 pl-3 sm:pl-4 pr-2 sm:pr-3 shrink-0">
                        <div className="h-8 w-8 sm:h-8 sm:w-8 rounded-3xl bg-primary flex items-center justify-center text-xs font-bold text-black">
                            {selectedIds.length}
                        </div>

                        <div className="hidden sm:flex flex-col leading-tight">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                                Batch
                            </span>
                            <span className="text-xs font-medium text-zinc-500">
                                selected
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 px-1 shrink-0 overflow-x-auto no-scrollbar snap-x snap-mandatory">
                        {renderActions()}
                    </div>

                    <div className="flex items-center shrink-0 border-l border-white/10 pl-1">
                        <button
                            onClick={onClear}
                            className="h-10 w-10 sm:h-8 sm:w-8 rounded-3xl hover:bg-white/10 flex items-center justify-center transition-all text-zinc-400 hover:text-white"
                            title="Discard"
                        >
                            {isBusy ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <X className="h-4 w-4" />
                            )}
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
