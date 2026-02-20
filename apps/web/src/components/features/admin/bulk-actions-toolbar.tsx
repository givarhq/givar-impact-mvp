'use client';

import React, { useState, useEffect, memo } from 'react';
import {
    Lock,
    Unlock,
    Shield,
    X,
    Loader2,
    ShieldOff,
    PlayCircle,
    Ban,
    Trash2,
    CheckCircle2
} from 'lucide-react';
import { Button } from '../../ui/button';
import { ConfirmModal } from '../../ui/confirm-modal';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { getCookie } from 'cookies-next';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsToolbarProps {
    selectedIds: string[];
    onClear: () => void;
    context?: 'USER' | 'PROJECT' | 'PROPOSAL';
}

export const BulkActionsToolbar = memo(function BulkActionsToolbar({
    selectedIds,
    onClear,
    context = 'USER'
}: BulkActionsToolbarProps) {
    const router = useRouter();
    const [isBusy, setIsBusy] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        action: string | null;
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
        const toastId = toast.loading('Executing Batch Operation...');
        try {
            if (context === 'USER') {
                await ApiService.admin.bulkUpdateUsers({
                    userIds: selectedIds,
                    action: action as any,
                });
            } else if (context === 'PROJECT') {
                await ApiService.admin.bulkUpdateProjects({
                    projectIds: selectedIds,
                    action: action as any,
                });
            } else if (context === 'PROPOSAL') {
                await ApiService.admin.bulkUpdateProposals({
                    proposalIds: selectedIds,
                    action: action as any,
                });
            }

            toast.success('Batch Operation Successful', { id: toastId });
            setConfirmConfig({ isOpen: false, action: null });
            onClear();
            router.refresh();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Batch Protocol Failure', { id: toastId });
        } finally {
            setIsBusy(false);
        }
    };

    const getActionMeta = (
        action: string | null
    ): { title: string; desc: string; variant: 'default' | 'destructive' | 'warning' } => {
        if (!action) return { title: '', desc: '', variant: 'default' };
        const count = selectedIds.length;

        if (context === 'USER') {
            const label = action.replace('SET_', '').replace('_', ' ');
            let variant: 'default' | 'destructive' | 'warning' = 'default';
            if (action === 'LOCK') variant = 'destructive';
            if (action === 'SET_ADMIN') variant = 'warning';
            if (action === 'SET_USER') variant = 'destructive';
            return {
                title: `Confirm Batch ${label}`,
                desc: `Apply ${label} status to ${count} selected account nodes?`,
                variant,
            };
        }

        if (context === 'PROJECT') {
            let variant: 'default' | 'destructive' | 'warning' = 'default';
            if (action === 'DELETE') variant = 'destructive';
            if (action === 'SUSPEND') variant = 'warning';
            return {
                title: `Confirm Batch ${action}`,
                desc: `Apply ${action.toLowerCase()} to ${count} project nodes? This is recorded in the Audit Trail.`,
                variant,
            };
        }

        if (context === 'PROPOSAL') {
            let variant: 'default' | 'destructive' | 'warning' = 'default';
            if (action === 'REJECT') variant = 'destructive';
            return {
                title: `Confirm Batch ${action}`,
                desc: `Perform bulk ${action.toLowerCase()} protocol on ${count} project proposals?`,
                variant,
            };
        }

        return {
            title: 'Confirm Batch Action',
            desc: `Proceed with ${action} for ${count} identified items?`,
            variant: 'default',
        };
    };

    const baseBtn =
        'flex-1 h-10 sm:h-9 rounded-3xl text-white font-bold text-xs tracking-wider px-3 sm:px-3.5 snap-start transition-all duration-200 active:scale-95';

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
            <AnimatePresence>
                <motion.div
                    initial={{ y: 100, x: '-50%', opacity: 0 }}
                    animate={{ y: 0, x: '-50%', opacity: 1 }}
                    exit={{ y: 100, x: '-50%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    className="fixed bottom-4 sm:bottom-20 left-1/2 z-[60] w-[95vw] sm:w-fit max-w-[95vw]"
                >
                    <div className="bg-zinc-950 text-white rounded-3xl shadow-2xl p-1 sm:p-1.5 flex items-center border border-white/10 backdrop-blur-2xl">

                        {/* LEFT SECTION: COUNTER */}
                        <div className="flex items-center gap-2 sm:gap-3 border-r border-white/10 pl-3 sm:pl-4 pr-2 sm:pr-3 shrink-0">
                            <div className="h-8 w-8 rounded-3xl bg-primary flex items-center justify-center text-xs font-black text-black">
                                {selectedIds.length}
                            </div>

                            <div className="hidden sm:flex flex-col leading-tight">
                                <span className="text-[10px] font-black tracking-[0.1em] text-zinc-300 ">
                                    Batch
                                </span>
                                <span className="text-[10px] font-bold text-zinc-500">
                                    Selected
                                </span>
                            </div>
                        </div>

                        {/* MIDDLE SECTION: ACTIONS */}
                        <div className="flex-1 min-w-0 flex items-center px-2 sm:gap-1 overflow-x-auto no-scrollbar justify-between">
                            {renderActions()}
                        </div>

                        {/* RIGHT SECTION: DISMISS */}
                        <div className="shrink-0 pl-0.5 sm:pl-1 border-l border-white/10">
                            <button
                                onClick={onClear}
                                className="h-9 w-9 sm:h-8 sm:w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-all text-zinc-400 hover:text-white"
                                title="Discard Selection"
                            >
                                {isBusy ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <X className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ isOpen: false, action: null })}
                onConfirm={executeBulkAction}
                isLoading={isBusy}
                variant={meta.variant}
                title={meta.title}
                description={meta.desc}
                confirmText="Confirm Action"
                cancelText="Cancel"
            />
        </>
    );
});