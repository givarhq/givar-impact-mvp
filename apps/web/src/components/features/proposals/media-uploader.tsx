'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, Loader2, Link as LinkIcon, X, FileText, Image as ImageIcon, Video, Trash2, Plus, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { MediaItem } from '../../../stores/proposal-store';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaManagerProps {
    items: MediaItem[];
    onAdd: (item: MediaItem) => void;
    onRemove: (id: string) => void;
    onUpdate: (id: string, updates: Partial<MediaItem>) => void;
    readOnly?: boolean;
}

export function MediaManager({ items, onAdd, onRemove, onUpdate, readOnly = false }: MediaManagerProps) {
    const [activeTab, setActiveTab] = useState('upload');
    const params = useParams();
    const proposalId = params.id as string;
    const [isLoading, setIsLoading] = useState(false);
    const [urlInput, setUrlInput] = useState('');

    useEffect(() => {
        items.forEach(async (item) => {
            if (item.key && !item.key.includes('://') && (!item.url || item.url === item.key)) {
                try {
                    const { viewUrl } = await ApiService.proposals.getPreviewUrl(item.key, proposalId);
                    onUpdate(item.id, { url: viewUrl });
                } catch (e) {
                    console.error("Preview sync failure", item.key);
                }
            }
        });
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        try {
            const type = file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
            const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({
                fileType: file.type,
                useCase: 'public',
            });

            await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, proposalId);

            onAdd({
                id: crypto.randomUUID(),
                url: viewUrl,
                key: key,
                type,
                caption: ''
            });

            toast.success('File added to gallery');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUrlAdd = () => {
        if (!urlInput) return;
        const isVideo = urlInput.includes('youtube') || urlInput.includes('vimeo') || urlInput.endsWith('.mp4');
        const isImage = urlInput.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;

        onAdd({
            id: crypto.randomUUID(),
            url: urlInput,
            key: urlInput,
            type: isVideo ? 'VIDEO' : (isImage ? 'IMAGE' : 'DOCUMENT'),
            caption: ''
        });
        setUrlInput('');
        toast.success('Link added');
    };

    return (
        <div className="space-y-4 w-full min-w-0">
            {!readOnly && (
                <div className="p-1.5 border border-border/40 rounded-3xl bg-muted/20 w-full min-w-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
                        <TabsList className="h-10 bg-muted/40 p-1 rounded-2xl w-full border border-border/40 mb-2 shadow-inner">
                            <TabsTrigger value="upload" className="rounded-xl text-[11px] font-bold uppercase tracking-widest gap-2 h-full data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                                <UploadCloud className="h-3.5 w-3.5" /> Upload
                            </TabsTrigger>
                            <TabsTrigger value="url" className="rounded-xl text-[11px] font-bold uppercase tracking-widest gap-2 h-full data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">
                                <LinkIcon className="h-3.5 w-3.5" /> Remote link
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-1">
                            <TabsContent value="upload" className="mt-0 outline-none">
                                <label className={cn(
                                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border/60 rounded-[22px] cursor-pointer bg-background/50 hover:bg-background hover:border-primary/30 transition-all group",
                                    isLoading && "opacity-50 cursor-not-allowed pointer-events-none"
                                )}>
                                    <div className="flex flex-col items-center justify-center">
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                        ) : (
                                            <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        )}
                                        <p className="mt-1.5 text-xs font-bold text-muted-foreground">Select local file</p>
                                    </div>
                                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isLoading} />
                                </label>
                            </TabsContent>

                            <TabsContent value="url" className="mt-0 outline-none">
                                <div className="flex gap-2 min-w-0">
                                    <Input
                                        placeholder="Paste image or video link..."
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        className="h-11 rounded-2xl bg-background border-border/40 min-w-0 flex-1 shadow-inner text-xs font-medium"
                                        onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                                    />
                                    <Button
                                        onClick={handleUrlAdd}
                                        disabled={!urlInput}
                                        className="h-11 rounded-2xl px-6 text-xs font-bold shrink-0 shadow-sm"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                <AnimatePresence mode="popLayout">
                    {items.map((item) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={item.id}
                            className={cn(
                                "group relative flex gap-3 p-3 rounded-3xl border transition-all duration-200 min-w-0",
                                readOnly ? "bg-transparent border-border/20" : "bg-card border-border/40 shadow-sm"
                            )}
                        >
                            <div className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border/40 shadow-inner relative">
                                {item.type === 'IMAGE' ? (
                                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                                ) : item.type === 'VIDEO' ? (
                                    <div className="flex flex-col items-center gap-0.5">
                                        <Video className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-[9px] font-black uppercase text-muted-foreground/60">Video</span>
                                    </div>
                                ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                                <div className="flex justify-between items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest border border-primary/10 shrink-0">
                                        {item.type}
                                    </span>
                                    {!readOnly && (
                                        <button
                                            onClick={() => onRemove(item.id)}
                                            className="h-6 w-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 outline-none"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                                <Input
                                    value={item.caption}
                                    onChange={(e) => onUpdate(item.id, { caption: e.target.value })}
                                    className={cn(
                                        "h-8 text-xs rounded-xl bg-muted/30 border-transparent focus:bg-background shadow-none px-2.5",
                                        readOnly && "font-medium opacity-80"
                                    )}
                                    placeholder="Add caption..."
                                    readOnly={readOnly}
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

export function ImageUploader({
    onUploadComplete,
    label,
    useCase = 'public'
}: {
    onUploadComplete: (data: { key: string; previewUrl: string }) => void,
    label: string,
    useCase?: 'public' | 'kyc' | 'docs'
}) {
    const params = useParams();
    const proposalId = params.id as string;
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsLoading(true);
        try {
            const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({ fileType: file.type, useCase });
            await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, proposalId);
            onUploadComplete({ key, previewUrl: viewUrl });
            toast.success('Uploaded successfully');
        } catch (e) {
            toast.error('Upload failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <label className={cn(
            "flex flex-col items-center justify-center w-full h-full min-h-[120px] border-2 border-dashed border-border/60 rounded-[28px] cursor-pointer bg-muted/10 hover:bg-muted/20 hover:border-primary/30 transition-all shadow-sm group",
            isLoading && "opacity-50 cursor-wait pointer-events-none"
        )}>
            <div className="flex flex-col items-center justify-center px-4 text-center">
                {isLoading ? (
                    <Loader2 className="animate-spin text-primary h-6 w-6" />
                ) : (
                    <div className="h-10 w-10 rounded-2xl bg-background border border-border/40 flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                        <UploadCloud className="text-muted-foreground h-5 w-5 group-hover:text-primary transition-colors" />
                    </div>
                )}
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isLoading} />
        </label>
    )
}