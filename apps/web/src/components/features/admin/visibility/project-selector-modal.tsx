'use client';

import React, { useState, useEffect, memo } from 'react';
import {
    Search,
    Loader2,
    MapPin,
    ChevronRight,
    Inbox,
    Hash
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '../../../ui/dialog';
import Image from 'next/image';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { ApiService } from '../../../../services/api';
import { Project } from '../../../../types';
import { SmartCurrency } from '../../../ui/smart-currency';
import { cn } from '../../../../lib/utils/cn';
import { getCookie } from 'cookies-next';
import { AnimatePresence, motion } from 'framer-motion';

interface ProjectSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (project: Project) => void;
    position: number;
}

export const ProjectSelectorModal = memo(function ProjectSelectorModal({
    isOpen,
    onClose,
    onSelect,
    position
}: ProjectSelectorModalProps) {
    const [query, setQuery] = useState('');
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setProjects([]);
            return;
        }

        const searchProjects = async () => {
            setIsLoading(true);
            try {
                const token = getCookie('givar_token') as string;
                const params = new URLSearchParams({
                    search: query.trim(),
                    limit: '5',
                    status: 'ACTIVE',
                    excludeDrafts: 'true'
                });
                const response = await ApiService.admin.getProjects(token, params);
                setProjects(response?.data || []);
            } catch (e) {
                setProjects([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeout = setTimeout(searchProjects, 300);
        return () => clearTimeout(timeout);
    }, [query, isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-lg w-full rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-card min-w-0">
                <DialogHeader className="px-6 pt-6 pb-2 border-none min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                            <Hash className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-lg font-bold truncate tracking-tight">
                            Slot {position + 1} Assignment
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="px-6 py-4 space-y-5 min-w-0">
                    <div className="relative group min-w-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find Project By Title, Identity, Or Location..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-12 h-14 rounded-2xl bg-muted/20 border-border/40 focus:bg-background text-sm font-medium shadow-inner transition-all"
                        />
                    </div>

                    <div className="space-y-1 max-h-[350px] overflow-y-auto no-scrollbar min-w-0">
                        {isLoading ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3 min-w-0">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                <span className="text-[11px] font-bold tracking-widest text-muted-foreground ">Searching Database</span>
                            </div>
                        ) : projects.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                                {projects.map((p) => (
                                    <motion.button
                                        key={p.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => onSelect(p)}
                                        className="w-full flex items-center justify-between p-3.5 rounded-[22px] border border-transparent hover:border-primary/20 hover:bg-primary/[0.02] transition-all group text-left min-w-0 active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="relative h-14 w-14 rounded-xl bg-muted overflow-hidden border border-border/40 shrink-0 shadow-sm">
                                                {p.imageUrl && (
                                                    <Image
                                                        src={p.imageUrl}
                                                        alt=""
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500"
                                                    />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{p.title}</p>
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground min-w-0">
                                                    <span className="truncate max-w-[140px] flex items-center gap-1.5">
                                                        <MapPin className="h-3.5 w-3.5 shrink-0 opacity-50" /> {p.location}
                                                    </span>
                                                    <span className="text-border">|</span>
                                                    <span className="text-primary font-bold whitespace-nowrap">
                                                        <SmartCurrency amount={p.raisedAmount} currency={p.currency} visible={true} size="small" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-all shrink-0 ml-3" />
                                    </motion.button>
                                ))}
                            </AnimatePresence>
                        ) : (
                            <div className="py-16 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 min-w-0">
                                <Inbox className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                                <p className="text-[10px] font-bold text-muted-foreground tracking-widest ">
                                    {query.length < 1 ? 'Start Typing To Explore' : 'No Matching Causes Identified'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 pb-6 pt-2 flex justify-end min-w-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-3xl h-10 px-6 font-bold text-xs tracking-widest text-muted-foreground hover:text-foreground transition-all"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
});