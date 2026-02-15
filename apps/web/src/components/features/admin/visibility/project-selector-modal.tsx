'use client';

import React, { useState, useEffect } from 'react';
import {
    Search, Loader2, Target, MapPin,
    ChevronRight, Inbox, Hash
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '../../../ui/dialog';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { ApiService } from '../../../../services/api';
import { Project } from '../../../../types';
import { SmartCurrency } from '../../../ui/smart-currency';
import { cn } from '../../../../lib/utils/cn';
import { getCookie } from 'cookies-next';

interface ProjectSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (project: Project) => void;
    position: number;
}

export function ProjectSelectorModal({ isOpen, onClose, onSelect, position }: ProjectSelectorModalProps) {
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
            <DialogContent className="max-w-[95vw] sm:max-w-lg w-full rounded-[24px] p-0 overflow-hidden border-none shadow-2xl bg-card min-w-0">
                <DialogHeader className="px-5 pt-5 pb-0 border-none min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Hash className="h-4 w-4" />
                        </div>
                        <DialogTitle className="text-sm font-bold truncate uppercase tracking-tight">
                            Slot {position + 1} Allocation
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="px-5 py-4 space-y-4 min-w-0">
                    <div className="relative group min-w-0">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Find project by title, ID, or location..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10 h-11 rounded-xl bg-muted/20 border-border/40 focus:bg-background text-sm font-medium"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1 max-h-[320px] overflow-y-auto no-scrollbar min-w-0">
                        {isLoading ? (
                            <div className="py-10 flex flex-col items-center justify-center gap-2 min-w-0">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Searching Ledger</span>
                            </div>
                        ) : projects.length > 0 ? (
                            projects.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p)}
                                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/[0.02] transition-all group text-left min-w-0"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                        <div className="h-11 w-11 rounded-lg bg-muted overflow-hidden border border-border/40 shrink-0 shadow-inner">
                                            {p.imageUrl && (
                                                <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-0.5">
                                            <p className="text-sm font-bold text-foreground truncate">{p.title}</p>
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground min-w-0">
                                                <span className="truncate max-w-[120px] flex items-center gap-1">
                                                    <MapPin className="h-3 w-3 shrink-0" /> {p.location}
                                                </span>
                                                <span className="text-border">|</span>
                                                <span className="text-primary font-bold whitespace-nowrap">
                                                    <SmartCurrency amount={p.raisedAmount} currency={p.currency} visible={true} size="small" />
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-all shrink-0 ml-2" />
                                </button>
                            ))
                        ) : (
                            <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-2xl bg-muted/5 min-w-0">
                                <Inbox className="h-6 w-6 mx-auto text-muted-foreground/20 mb-1.5" />
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {query.length < 1 ? 'Start typing' : 'No results'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-5 pb-5 pt-1 flex justify-end min-w-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-xl h-9 px-5 font-bold text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}