'use client';

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Target, MapPin, ChevronRight, Inbox } from 'lucide-react';
import { Modal } from '../../../ui/modal';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { ApiService } from '../../../../services/api';
import { Project } from '../../../../types';
import { SmartCurrency } from '../../../ui/smart-currency';
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
                    search: query,
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Pin to Slot ${position + 1}`}
            description="Search the ledger for an active project to feature in this discovery position."
        >
            <div className="space-y-6 pt-2">
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Search by title, slug, or location..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-10 h-11 rounded-2xl bg-muted/20 border-border/40 focus:bg-background"
                        autoFocus
                    />
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                    {isLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Scanning Ledger...</span>
                        </div>
                    ) : projects.length > 0 ? (
                        projects.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onSelect(p)}
                                className="w-full flex items-center justify-between p-3.5 rounded-[22px] border border-border/40 bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all group text-left shadow-sm"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden border border-border/40 shrink-0">
                                        {p.imageUrl ? (
                                            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-primary/5" />
                                        )}
                                    </div>
                                    <div className="min-w-0 space-y-0.5">
                                        <p className="text-sm font-bold text-foreground truncate">{p.title}</p>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                            <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {p.location}</span>
                                            <span className="flex items-center gap-1 text-primary">
                                                <Target className="h-2.5 w-2.5" />
                                                <SmartCurrency amount={p.raisedAmount} currency={p.currency} visible={true} size="small" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                            </button>
                        ))
                    ) : (
                        <div className="py-12 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                            <Inbox className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                {query.length < 2 ? 'Enter project details' : 'No matches found'}
                            </p>
                        </div>
                    )}
                </div>

                <div className="pt-2">
                    <Button variant="ghost" onClick={onClose} className="w-full rounded-3xl font-bold text-xs text-muted-foreground">
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}