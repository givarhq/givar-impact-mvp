'use client';

import React, { useState, useEffect, memo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    FolderTree, Plus, Edit2, Trash2, Loader2, Inbox, Check
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

const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    icon: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export const AdminCategoryTable = memo(function AdminCategoryTable() {
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
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

    const openCreateModal = () => {
        setEditingCategory(null);
        reset({ name: '', description: '', icon: '' });
        setIsModalOpen(true);
    };

    const openEditModal = (cat: any) => {
        setEditingCategory(cat);
        setValue('name', cat.name);
        setValue('description', cat.description || '');
        setValue('icon', cat.icon || '');
        setIsModalOpen(true);
    };

    const onSubmit = async (data: CategoryFormValues) => {
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

    const handleDelete = async () => {
        if (!deletingId) return;
        setIsSubmitting(true);
        const toastId = toast.loading("Executing forensic deletion...");
        try {
            await ApiService.admin.deleteCategory(deletingId);
            toast.success("Category deleted successfully", { id: toastId });
            setIsDeleteOpen(false);
            fetchCategories();
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Category is linked to active projects and cannot be removed.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50 mb-4" />
                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Syncing Taxonomy Database</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full min-w-0">
            <div className="flex justify-between items-center px-1 mb-2">
                <div className="space-y-1">
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-primary" /> Sector Taxonomy
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium hidden md:block">Manage the core categories used to organize impact projects.</p>
                </div>
                <Button onClick={openCreateModal} className="rounded-3xl h-10 px-5 font-bold text-xs bg-primary text-white shadow-lg shadow-primary/20 border-0 active:scale-95 transition-all">
                    <Plus className="h-4 w-4 mr-1.5" /> Create Sector
                </Button>
            </div>

            {categories.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                    <Inbox className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                    <h3 className="text-sm font-bold text-foreground opacity-60">No Sectors Configured</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">Create a category to begin organizing projects.</p>
                </div>
            ) : (
                <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden w-full">
                    <div className="overflow-x-auto no-scrollbar w-full">
                        <table className="w-full text-sm text-left border-collapse min-w-full">
                            <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-[10px] tracking-widest uppercase">Sector Identity</th>
                                    <th className="px-6 py-4 font-bold text-[10px] tracking-widest uppercase">URL Slug</th>
                                    <th className="px-6 py-4 font-bold text-[10px] tracking-widest uppercase">Visibility Weight</th>
                                    <th className="px-6 py-4 font-bold text-[10px] tracking-widest uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                <AnimatePresence mode="popLayout">
                                    {categories.map((cat) => (
                                        <motion.tr
                                            key={cat.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="hover:bg-muted/30 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shadow-inner">
                                                        {cat.icon ? cat.icon.charAt(0) : cat.name.charAt(0)}
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-foreground leading-tight text-sm">
                                                            {cat.name}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground font-medium truncate max-w-[200px]">
                                                            {cat.description || 'No description provided'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="font-mono text-[10px] bg-muted/30 border-border/40 text-muted-foreground shadow-none">
                                                    /{cat.slug}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold tabular-nums text-primary">{Number(cat.visibilityWeight).toFixed(1)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => openEditModal(cat)}
                                                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors active:scale-90"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => { setDeletingId(cat.id); setIsDeleteOpen(true); }}
                                                        className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors active:scale-90"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <Dialog open={isModalOpen} onOpenChange={(open) => !open && !isSubmitting && setIsModalOpen(false)}>
                <DialogContent className="rounded-3xl border-none shadow-2xl bg-card p-6 md:p-8 max-w-md">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-bold flex items-center gap-3">
                            <FolderTree className="h-5 w-5 text-primary" />
                            {editingCategory ? 'Update Sector' : 'Register New Sector'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Category Name"
                            placeholder="e.g. Clean Energy"
                            {...register('name')}
                            error={errors.name?.message}
                            disabled={isSubmitting}
                            className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                        />
                        <Textarea
                            label="Brief Description (Optional)"
                            placeholder="Define the scope of this sector..."
                            {...register('description')}
                            error={errors.description?.message}
                            disabled={isSubmitting}
                            className="min-h-[100px] rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                        />
                        <Input
                            label="Lucide Icon Reference (Optional)"
                            placeholder="e.g. Zap, Heart, Shield"
                            {...register('icon')}
                            error={errors.icon?.message}
                            disabled={isSubmitting}
                            className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background"
                        />

                        <div className="pt-4 flex gap-3">
                            <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/20 border-0 bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all">
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingCategory ? "Save Changes" : "Register Sector")}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                isLoading={isSubmitting}
                variant="destructive"
                title="Delete Category Node"
                description="Are you sure you want to remove this sector taxonomy? This action will be blocked by the system if any active projects or proposals are currently utilizing it."
                confirmText="Execute Deletion"
            />
        </div>
    );
});