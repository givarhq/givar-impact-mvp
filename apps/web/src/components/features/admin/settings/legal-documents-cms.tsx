'use client';

import React, { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Save, Loader2, Info, LayoutTemplate, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { RichTextEditor } from '../../../ui/rich-text-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../ui/tabs';
import { ApiService } from '../../../../services/api';
import toast from 'react-hot-toast';
import { cn } from '../../../../lib/utils/cn';
import { motion } from 'framer-motion';
import { formatDate } from '../../../../lib/utils/format';

interface LegalDoc {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
    admin?: { email: string; firstName: string };
}

const LEGAL_REGISTRY = [
    { slug: 'privacy', defaultTitle: 'Privacy Policy' },
    { slug: 'terms', defaultTitle: 'Terms of Service' },
    { slug: 'refund', defaultTitle: 'Refund Policy' },
    { slug: 'cancellation', defaultTitle: 'Cancellation Policy' },
    { slug: 'agreement', defaultTitle: 'Cause Organiser Agreement' },
    { slug: 'partner-agreement', defaultTitle: 'Partner Agreement' },
    { slug: 'acceptable-use', defaultTitle: 'Acceptable Use Policy' }
];

// Strict XSS Sanitizer for Legal Inputs
const sanitizeHtml = (html: string): string => {
    if (!html) return '';
    return html
        .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
        .replace(/on\w+\s*=\s*"(?:[^"]*)"/gi, '')
        .replace(/on\w+\s*=\s*'(?:[^']*)'/gi, '')
        .replace(/on\w+\s*=\s*([^"\s>]+)/gi, '')
        .replace(/href\s*=\s*"(javascript:[^"]*)"/gi, '')
        .replace(/href\s*=\s*'(javascript:[^']*)'/gi, '');
};

export const LegalDocumentsCms = memo(function LegalDocumentsCms({ initialDocs }: { initialDocs: LegalDoc[] }) {
    const router = useRouter();
    const [docs, setDocs] = useState<LegalDoc[]>(initialDocs);
    const [selectedSlug, setSelectedSlug] = useState<string>('terms');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('editor');

    const currentDocMeta = docs.find(d => d.slug === selectedSlug);

    // Synchronize editor state when switching documents
    useEffect(() => {
        const doc = docs.find(d => d.slug === selectedSlug);
        if (doc) {
            setTitle(doc.title);
            setContent(doc.content);
        } else {
            const registryMatch = LEGAL_REGISTRY.find(r => r.slug === selectedSlug);
            setTitle(registryMatch?.defaultTitle || '');
            setContent('');
        }
    }, [selectedSlug, docs]);

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            return toast.error("Document title and content are required.");
        }

        setIsSaving(true);
        const toastId = toast.loading("Publishing legal document...");

        try {
            const safeContent = sanitizeHtml(content);
            const response = await ApiService.legalDocs.adminUpdate(selectedSlug, {
                title: title.trim(),
                content: safeContent
            });

            // Update local state to reflect new cache without requiring hard reload
            setDocs(prev => {
                const filtered = prev.filter(d => d.slug !== selectedSlug);
                return [...filtered, response];
            });

            toast.success("Document published successfully", { id: toastId });
            router.refresh(); // Tells Next.js to invalidate client router cache
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to publish document", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto space-y-6 md:space-y-8"
        >
            <div className="flex flex-row items-center justify-between gap-4 px-1">
                <div className="space-y-1 min-w-0">
                    <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> Legal & Compliance
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium truncate">
                        Manage platform policies. Changes here are immediately reflected across the platform.
                    </p>
                </div>
            </div>

            <Card className="rounded-3xl border-border/40 bg-card shadow-sm overflow-hidden border-2">
                <CardHeader className="bg-muted/30 border-b border-border/40 p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-muted-foreground ml-1">Select Policy Document</label>
                            <Select value={selectedSlug} onValueChange={setSelectedSlug} disabled={isSaving}>
                                <SelectTrigger className="h-12 rounded-2xl bg-background border-border/60 focus:bg-background text-sm font-bold shadow-sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-xl border-border/40">
                                    {LEGAL_REGISTRY.map(reg => (
                                        <SelectItem key={reg.slug} value={reg.slug} className="text-xs font-bold py-2.5">
                                            {reg.defaultTitle}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-3 justify-start md:justify-end text-right min-w-0">
                            {currentDocMeta ? (
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Status</p>
                                    <p className="text-xs font-bold text-emerald-600 flex items-center justify-start md:justify-end gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Published (v. {formatDate(currentDocMeta.updatedAt).split(',')[0]})
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-0.5 text-left md:text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Current Status</p>
                                    <p className="text-xs font-bold text-amber-600">Pending Initialization</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="px-6 md:px-8 pt-6 border-b border-border/40">
                            <TabsList className="bg-muted/50 p-1 rounded-2xl h-11 w-full md:w-auto border border-border/40 shadow-inner mb-4 inline-flex">
                                <TabsTrigger value="editor" className="rounded-xl px-6 gap-2 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                    <FileText className="h-3.5 w-3.5" /> Editor
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="rounded-xl px-6 gap-2 h-full text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                    <LayoutTemplate className="h-3.5 w-3.5" /> Public Live Preview
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="editor" className="mt-0 p-6 md:p-8 space-y-6 outline-none">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Document Title</label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Terms of Service"
                                    className="h-12 rounded-2xl bg-muted/20 border-border/60 focus:bg-background text-sm font-bold shadow-inner"
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-muted-foreground ml-1">Document Body (HTML)</label>
                                <RichTextEditor
                                    content={content}
                                    onChange={setContent}
                                    placeholder="Draft the legal policy here. Use headings (H2/H3) for sections to trigger the automatic public styling..."
                                    readOnly={isSaving}
                                />
                            </div>

                            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3 shadow-sm">
                                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                    <strong>Formatting Tip:</strong> Always use Heading 2 (H2) for your main section titles. The public frontend automatically injects top-borders and spacing for all H2 tags to ensure consistent reading experiences.
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-0 p-6 md:p-8 outline-none">
                            <div className="border border-border/40 rounded-3xl p-8 md:p-12 shadow-inner bg-card overflow-hidden">
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="space-y-2 border-b border-border/40 pb-6">
                                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                                            {title || 'Document Title'}
                                        </h1>
                                        <p className="text-sm text-muted-foreground font-medium">
                                            Last updated: {currentDocMeta ? formatDate(currentDocMeta.updatedAt).split(',')[0] : 'Just now'}
                                        </p>
                                    </div>

                                    <div
                                        className={cn(
                                            "max-w-none text-sm text-foreground leading-loose font-medium break-words",
                                            "[&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h2]:text-lg [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:pt-6 [&_h2]:border-t [&_h2]:border-border/40 first:[&_h2]:border-none first:[&_h2]:pt-0 first:[&_h2]:mt-0",
                                            "[&_h3]:font-bold [&_h3]:tracking-tight [&_h3]:text-foreground [&_h3]:text-base [&_h3]:mt-6 [&_h3]:mb-3",
                                            "[&_p]:text-foreground [&_p]:mb-6 [&_p]:last:mb-0",
                                            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-6 [&_ul]:space-y-3 [&_ul]:text-foreground [&_ul_li::marker]:text-primary/50",
                                            "[&_strong]:font-bold [&_strong]:text-foreground",
                                            "[&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary/80 transition-colors"
                                        )}
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) || '<p class="text-muted-foreground italic">Your document preview will appear here...</p>' }}
                                    />
                                </div>
                            </div>
                        </TabsContent>

                        <div className="p-6 md:p-8 bg-muted/10 border-t border-border/40 flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !title.trim() || !content.trim()}
                                className="w-full sm:w-auto h-12 px-10 rounded-3xl font-bold text-sm shadow-xl shadow-primary/20 bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all border-0"
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
                                Publish Document
                            </Button>
                        </div>
                    </Tabs>
                </CardContent>
            </Card>
        </motion.div>
    );
});