'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, Loader2, Link as LinkIcon, X, FileText, Image as ImageIcon, Video, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiService } from '../../../services/api';
import { cn } from '../../../lib/utils/cn';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { MediaItem } from '../../../stores/proposal-store';
import { useParams } from 'next/navigation';

interface MediaManagerProps {
  items: MediaItem[];
  onAdd: (item: MediaItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<MediaItem>) => void;
}

export function MediaManager({ items, onAdd, onRemove, onUpdate }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const params = useParams();
  const proposalId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Hydrate preview URLs for existing private keys on mount
  useEffect(() => {
    items.forEach(async (item) => {
      // Check if it's an S3 key (not a full URL) and we haven't fetched a preview yet
      if (item.key && !item.key.includes('://') && (!item.url || item.url === item.key)) {
        try {
          const { viewUrl } = await ApiService.proposals.getPreviewUrl(item.key, proposalId);
          onUpdate(item.id, { url: viewUrl });
        } catch (e) {
          console.error("Failed to refresh preview for", item.key);
        }
      }
    });
  }, []);

  // --- Upload Handler ---
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
          url: viewUrl, // For display
          key: key,     // For DB persistence
          type,
          caption: ''
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
      
      const isVideo = urlInput.includes('youtube') || urlInput.includes('vimeo') || urlInput.endsWith('.mp4');
      const isImage = urlInput.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
      
      onAdd({
          id: crypto.randomUUID(),
          url: urlInput,
          key: urlInput, // For external URLs, the key IS the URL
          type: isVideo ? 'VIDEO' : (isImage ? 'IMAGE' : 'DOCUMENT'),
          caption: ''
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
                        className="flex-1 rounded-xl"
                    />
                    <Button onClick={handleUrlAdd} disabled={!urlInput} className="rounded-xl">Add</Button>
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
                                <img src={item.url} alt={item.caption || 'Preview'} className="h-full w-full object-cover" />
                            ) : item.type === 'VIDEO' ? (
                                <Video className="h-8 w-8 text-muted-foreground" />
                            ) : (
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            )}
                        </div>

                        {/* Details Editor */}
                        <div className="flex-1 min-w-0 flex flex-col gap-2 justify-center">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground uppercase tracking-wide">{item.type}</span>
                                
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" 
                                    onClick={() => onRemove(item.id)}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            
                            <Input 
                                value={item.caption} 
                                onChange={(e) => onUpdate(item.id, { caption: e.target.value })}
                                className="h-8 text-xs bg-muted/30 border-transparent focus:bg-background focus:border-input rounded-lg"
                                placeholder="Add a caption (optional)..."
                            />
                        </div>
                    </div>
                ))}
            </div>
        )}
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
        if(!file) return;
        setIsLoading(true);
        try {
            const { uploadUrl, key } = await ApiService.proposals.getUploadUrl({ 
                fileType: file.type, 
                useCase 
            });

            await fetch(uploadUrl, { method: 'PUT', body: file, headers: {'Content-Type': file.type} });

            const { viewUrl } = await ApiService.proposals.getPreviewUrl(key, proposalId);
            
            onUploadComplete({ key, previewUrl: viewUrl });
            toast.success('Uploaded!');
        } catch(e) { toast.error('Failed'); } finally { setIsLoading(false); }
    };

    return (
        <label className={cn("flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-xl cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors", isLoading && "opacity-50 cursor-wait")}>
            {isLoading ? <Loader2 className="animate-spin text-muted-foreground h-8 w-8" /> : <UploadCloud className="text-muted-foreground h-8 w-8" />}
            <span className="mt-2 text-sm text-muted-foreground font-medium">{label}</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isLoading} />
        </label>
    )
}