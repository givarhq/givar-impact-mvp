'use client';

import React, { useState, useEffect, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    FolderTree, Plus, Edit2, Trash2, Loader2, Inbox,
    ChevronDown, ChevronRight, Link as LinkIcon, AlertCircle
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent } from '../../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { ConfirmModal } from '../../ui/confirm-modal';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils/cn';

// --- SCHEMAS ---

const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    icon: z.string().optional(),
});

const subcategorySchema = z.object({
    name: z.string().min(2, "Focus area must be at least 2 characters"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type SubcategoryFormValues = z.infer<typeof subcategorySchema>;

export const AdminCategoryTable = memo(function AdminCategoryTable() {
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Expansion State
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Modals & Context State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
    const [parentCategoryId, setParentCategoryId] = useState<string | null>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteType, setDeleteType] = useState<'CATEGORY' | 'SUBCATEGORY' | null>(null);

    // Form Hooks
    const categoryForm = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
    });

    const subForm = useForm<SubcategoryFormValues>({
        resolver: zodResolver(subcategorySchema),
    });

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const data = await ApiService.projects.getCategories();
            setCategories(data || []);
        } catch (error) {
            toast.error("Failed to sync category taxonomy");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Global event listener for external "New Category" button
    useEffect(() => {
        const handleOpen = () => openCategoryModal();
        window.addEventListener('open-category-modal', handleOpen);
        return () => window.removeEventListener('open-category-modal', handleOpen);
    }, []);

    // --- MAIN CATEGORY HANDLERS ---

    const toggleExpand = (id: string) => {
        setExpandedCategory(prev => prev === id ? null : id);
    };

    const openCategoryModal = () => {
        setEditingCategory(null);
        categoryForm.reset({ name: '', description: '', icon: '' });
        setIsModalOpen(true);
    };

    const openEditCategory = (cat: any) => {
        setEditingCategory(cat);
        categoryForm.setValue('name', cat.name);
        categoryForm.setValue('description', cat.description || '');
        categoryForm.setValue('icon', cat.icon || '');
        setIsModalOpen(true);
    };

    const onSubmitCategory = async (data: CategoryFormValues) => {
        setIsSubmitting(true);
        const toastId = toast.loading(editingCategory ? "Updating category..." : "Creating category...");
        try {
            if (editingCategory) {
                await ApiService.admin.updateCategory(editingCategory.id, data);
            } else {
                await ApiService.admin.createCategory(data);
            }
            toast.success(editingCategory ? "Category updated" : "Category created", { id: toastId });
            setIsModalOpen(false);
            fetchCategories();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Operation failed", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- SUBCATEGORY HANDLERS ---

    const openCreateSubcategory = (categoryId: string) => {
        setEditingSubcategory(null);
        setParentCategoryId(categoryId);
        subForm.reset({ name: '' });
        setIsSubModalOpen(true);
    };

    const openEditSubcategory = (sub: any) => {
        setEditingSubcategory(sub);
        setParentCategoryId(sub.categoryId);
        subForm.setValue('name', sub.name);
        setIsSubModalOpen(true);
    };

    const onSubmitSubcategory = async (data: SubcategoryFormValues) => {
        if (!parentCategoryId && !editingSubcategory) return;

        setIsSubmitting(true);
        const toastId = toast.loading(editingSubcategory ? "Updating focus area..." : "Creating focus area...");
        try {
            if (editingSubcategory) {
                await ApiService.admin.updateSubcategory(editingSubcategory.id, data);
            } else {
                await ApiService.admin.createSubcategory(parentCategoryId!, data);
            }
            toast.success(editingSubcategory ? "Focus area updated" : "Focus area added", { id: toastId });
            setIsSubModalOpen(false);
            fetchCategories();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Operation failed", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- UNIVERSAL DELETE HANDLER ---

    const handleDelete = async () => {
        if (!deletingId || !deleteType) return;
        setIsSubmitting(true);
        const toastId = toast.loading(`Deleting ${deleteType.toLowerCase()}...`);
        try {
            if (deleteType === 'CATEGORY') {
                await ApiService.admin.deleteCategory(deletingId);
            } else {
                await ApiService.admin.deleteSubcategory(deletingId);
            }
            toast.success("Successfully removed from taxonomy", { id: toastId });
            setIsDeleteOpen(false);
            fetchCategories();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Node is actively linked to projects and cannot be removed.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmDelete = (id: string, type: 'CATEGORY' | 'SUBCATEGORY') => {
        setDeletingId(id);
        setDeleteType(type);
        setIsDeleteOpen(true);
    };

    // --- RENDER ---

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50 mb-4" />
                <p className="text-xs font-bold text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full min-w-0 pb-20">
            {categories.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                    <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <h3 className="text-sm font-bold text-foreground opacity-60">No Taxonomy Configured</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Create your first category to begin organizing projects.</p>
                </div>
            ) : (
                <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden w-full">
                    <div className="overflow-x-auto no-scrollbar w-full">
                        <table className="w-full text-sm text-left border-collapse min-w-full">
                            <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 w-12"></th>
                                    <th className="px-6 py-4 font-bold text-[10px] tracking-widest uppercase">Primary Sector</th>
                                    <th className="px-6 py-4 font-bold text-[10px] tracking-widest uppercase">URL Slug</th>
                                    <th className="px-6 py-4 font-bold text-[10px] tracking-widest uppercase text-center">Visibility Weight</th>
                                    <th className="px-6 py-4 font-bold text-[10px] tracking-widest uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {categories.map((cat) => {
                                    const isExpanded = expandedCategory === cat.id;
                                    const subs = cat.subcategories || [];

                                    return (
                                        <React.Fragment key={cat.id}>
                                            <tr
                                                className={cn(
                                                    "transition-colors cursor-pointer group hover:bg-muted/20",
                                                    isExpanded && "bg-primary/[0.02]"
                                                )}
                                                onClick={() => toggleExpand(cat.id)}
                                            >
                                                <td className="px-6 py-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                                                    {isExpanded ? <ChevronDown className="h-4 w-4 text-primary" /> : <ChevronRight className="h-4 w-4" />}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="space-y-0.5">
                                                            <p className="font-bold text-foreground leading-tight text-sm flex items-center gap-2 group-hover:text-primary transition-colors">
                                                                {cat.name}
                                                                <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-3xl border border-border/40 shadow-none">
                                                                    {subs.length} Foci
                                                                </span>
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground font-medium truncate max-w-[300px]">
                                                                {cat.description || 'No operational description provided.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="font-mono text-[11px] bg-muted/30 border-border/40 text-muted-foreground shadow-none">
                                                        /{cat.slug}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="inline-flex items-center justify-center px-3 py-1 rounded-3xl bg-background border border-border/60 shadow-sm text-xs font-black tabular-nums text-primary">
                                                        {Number(cat.visibilityWeight).toFixed(1)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openCreateSubcategory(cat.id)}
                                                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors active:scale-90"
                                                            title="Add Focus Area"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                        <div className="w-px h-4 bg-border/60 mx-1" />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => openEditCategory(cat)}
                                                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors active:scale-90"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => confirmDelete(cat.id, 'CATEGORY')}
                                                            className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors active:scale-90"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.tr
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                                        className="bg-muted/[0.02]"
                                                    >
                                                        <td colSpan={5} className="p-0 border-none overflow-hidden">
                                                            <div className="px-14 py-6 border-t border-border/20 space-y-4">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground/50" />
                                                                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Specific Focus Areas</span>
                                                                </div>

                                                                {subs.length === 0 ? (
                                                                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border/60 bg-muted/10 text-muted-foreground text-xs font-medium italic">
                                                                        <AlertCircle className="h-4 w-4" /> No specific focus areas exist for {cat.name}. Projects will fall under the general sector.
                                                                    </div>
                                                                ) : (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                        {subs.map((sub: any) => (
                                                                            <div key={sub.id} className="flex items-center justify-between p-3 rounded-2xl border border-border/40 bg-card shadow-sm group/sub transition-all hover:border-primary/30">
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="text-xs font-bold text-foreground truncate">{sub.name}</p>
                                                                                    <p className="text-[11px] text-muted-foreground font-mono truncate opacity-60">/{sub.slug}</p>
                                                                                </div>
                                                                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                                                    <Button variant="ghost" size="icon" onClick={() => openEditSubcategory(sub)} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                                                                                        <Edit2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                    <Button variant="ghost" size="icon" onClick={() => confirmDelete(sub.id, 'SUBCATEGORY')} className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                                                        <Trash2 className="h-3 w-3" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* --- PRIMARY CATEGORY MODAL --- */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && !isSubmitting && setIsModalOpen(false)}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-card p-6 md:p-8 max-w-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-3 text-foreground">
                            <FolderTree className="h-5 w-5 text-primary" />
                            {editingCategory ? 'Update Sector' : 'Register New Sector'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                        <Input
                            label="Sector Name"
                            placeholder="e.g. Clean Energy"
                            {...categoryForm.register('name')}
                            error={categoryForm.formState.errors.name?.message}
                            disabled={isSubmitting}
                            className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                        />
                        <Textarea
                            label="Brief Description (Optional)"
                            placeholder="Define the scope of this sector..."
                            {...categoryForm.register('description')}
                            error={categoryForm.formState.errors.description?.message}
                            disabled={isSubmitting}
                            className="min-h-[100px] rounded-2xl bg-muted/20 border-border/60 focus:bg-background resize-none"
                        />
                        <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 border-0 bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingCategory ? "Save Modifications" : "Register Sector")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- SUBCATEGORY MODAL --- */}
            <Dialog open={isSubModalOpen} onOpenChange={(open) => !open && !isSubmitting && setIsSubModalOpen(false)}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-card p-6 md:p-8 max-w-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-3 text-foreground">
                            <LinkIcon className="h-5 w-5 text-primary" />
                            {editingSubcategory ? 'Edit Focus Area' : 'Add Focus Area'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={subForm.handleSubmit(onSubmitSubcategory)} className="space-y-4">
                        <Input
                            label="Focus Name"
                            placeholder="e.g. Surgery, Water Drilling..."
                            {...subForm.register('name')}
                            error={subForm.formState.errors.name?.message}
                            disabled={isSubmitting}
                            className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                        />
                        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 shadow-sm flex items-start gap-3 mt-2">
                            <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 font-medium leading-relaxed">
                                Donors can filter by this specific focus when exploring causes in the sector.
                            </p>
                        </div>
                        <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 border-0 bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingSubcategory ? "Save Changes" : "Create Focus Area")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- UNIVERSAL DELETE MODAL --- */}
            <ConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                isLoading={isSubmitting}
                variant="destructive"
                title={deleteType === 'CATEGORY' ? "Remove Primary Sector?" : "Remove Focus Area?"}
                description="Are you sure you want to permanently remove this node from the taxonomy? The system will block this action if any active projects or proposals are currently utilizing it to prevent broken references."
                confirmText="Confirm Removal"
            />
        </div>
    );
});