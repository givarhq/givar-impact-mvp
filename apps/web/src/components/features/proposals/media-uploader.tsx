'use client';

import { useState } from 'react';
import { UploadCloud, Loader2, Link as LinkIcon, X, FileText, Image as ImageIcon, Video, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { MediaItem } from '../../../stores/proposal-store';

interface MediaManagerProps {
  items: MediaItem[];
  onAdd: (item: MediaItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MediaItem>) => void;
}

export function MediaManager({ items, onAdd, onRemove, onUpdate }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // --- Upload Handler ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB.');
      return;
    }
    
    setIsLoading(true);
    try {
      const type = file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT';
      
      // 1. Get Presigned URL
      const { uploadUrl, publicUrl } = await ApiService.proposals.getUploadUrl({
        fileType: file.type,
        useCase: 'public',
      });

      // 2. Upload to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // 3. Add to Store
      onAdd({
          id: crypto.randomUUID(),
          url: publicUrl!,
          type,
          caption: file.name
      });
      
      toast.success('Uploaded successfully!');
    } catch (error) {
      toast.error('Upload failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- URL Handler ---
  const handleUrlAdd = () => {
      if (!urlInput) return;
      // Simple heuristic for type
      const isVideo = urlInput.includes('youtube') || urlInput.includes('vimeo') || urlInput.endsWith('.mp4');
      const isImage = urlInput.match(/\.(jpeg|jpg|gif|png)$/) != null;
      
      onAdd({
          id: crypto.randomUUID(),
          url: urlInput,
          type: isVideo ? 'VIDEO' : (isImage ? 'IMAGE' : 'DOCUMENT'),
          caption: 'External Media'
      });
      setUrlInput('');
  };

  return (
    <div className="space-y-6">
        
        {/* ADD MEDIA AREA */}
        <div className="p-4 border border-border rounded-xl bg-card">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full mb-4">
                    <TabsTrigger value="upload" className="flex-1 gap-2"><UploadCloud className="h-4 w-4" /> Upload</TabsTrigger>
                    <TabsTrigger value="url" className="flex-1 gap-2"><LinkIcon className="h-4 w-4" /> Add Link</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-0">
                    <label className={cn(
                        "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors",
                        isLoading && "opacity-50 cursor-not-allowed"
                    )}>
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isLoading ? (
                                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                            ) : (
                                <Plus className="h-8 w-8 text-muted-foreground" />
                            )}
                            <p className="mt-2 text-sm text-muted-foreground">Click to upload Image or Doc</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={isLoading} />
                    </label>
                </TabsContent>

                <TabsContent value="url" className="mt-0 flex gap-2">
                    <Input 
                        placeholder="https://..." 
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="flex-1"
                    />
                    <Button onClick={handleUrlAdd} disabled={!urlInput}>Add</Button>
                </TabsContent>
            </Tabs>
        </div>

        {/* MEDIA LIST */}
        {items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                    <div key={item.id} className="group relative flex gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-md transition-all">
                        {/* Thumbnail / Icon */}
                        <div className="h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
                            {item.type === 'IMAGE' ? (
                                <img src={item.url} alt={item.caption} className="h-full w-full object-cover" />
                            ) : item.type === 'VIDEO' ? (
                                <Video className="h-8 w-8 text-muted-foreground" />
                            ) : (
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>

                        {/* Details Editor */}
                        <div className="flex-1 min-w-0 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground uppercase">{item.type}</span>
                                </div>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => onRemove(item.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            
                            <Input 
                                value={item.caption} 
                                onChange={(e) => onUpdate(item.id, { caption: e.target.value })}
                                className="h-8 text-xs"
                                placeholder="Add a caption..."
                            />
                            
                            <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline truncate">
                                {item.url}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}

// Simple export for single image upload (Legacy support for coverImage)
export function ImageUploader({ onUploadComplete, label }: { onUploadComplete: (url: string) => void, label: string, useCase?: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        setIsLoading(true);
        try {
            const { uploadUrl, publicUrl } = await ApiService.proposals.getUploadUrl({ fileType: file.type, useCase: 'public' });
            await fetch(uploadUrl, { method: 'PUT', body: file, headers: {'Content-Type': file.type} });
            onUploadComplete(publicUrl!);
        } catch(e) { toast.error('Failed'); } finally { setIsLoading(false); }
    };

    return (
        <label className={cn("flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors", isLoading && "opacity-50")}>
            {isLoading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
            <span className="mt-2 text-sm text-muted-foreground">{label}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isLoading} />
        </label>
    )
}