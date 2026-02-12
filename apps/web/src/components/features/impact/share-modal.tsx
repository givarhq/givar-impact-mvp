'use client';

import { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import toast from 'react-hot-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  projectSlug: string;
}

const Icons = {
  Twitter: (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
  ),
  WhatsApp: (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
  ),
  LinkedIn: (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
  ),
};

export function ShareModal({ isOpen, onClose, projectTitle, projectSlug }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dashboard/impact/${projectSlug}`
    : '';

  const shareText = `Join me in supporting ${projectTitle} on Givar. It's transparent and impactful.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTo = (platform: string) => {
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`Check out ${projectTitle}`)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`;
        break;
    }
    window.open(url, '_blank', 'width=600,height=400');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share this cause"
      description="Help us reach more donors by sharing this project with your network."
    >
      <div className="space-y-5 pt-3">

        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => shareTo('whatsapp')} className="flex flex-col items-center gap-1.5 group outline-none">
            <div className="h-11 w-11 rounded-3xl bg-green-500/10 text-green-600 flex items-center justify-center transition-all group-hover:bg-green-500 group-hover:text-white border border-green-500/10 shadow-sm">
              <Icons.WhatsApp className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">WhatsApp</span>
          </button>

          <button onClick={() => shareTo('twitter')} className="flex flex-col items-center gap-1.5 group outline-none">
            <div className="h-11 w-11 rounded-3xl bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all group-hover:bg-black group-hover:text-white border border-zinc-500/10 shadow-sm">
              <Icons.Twitter className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">X</span>
          </button>

          <button onClick={() => shareTo('linkedin')} className="flex flex-col items-center gap-1.5 group outline-none">
            <div className="h-11 w-11 rounded-3xl bg-blue-600/10 text-blue-600 flex items-center justify-center transition-all group-hover:bg-blue-600 group-hover:text-white border border-blue-600/10 shadow-sm">
              <Icons.LinkedIn className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">LinkedIn</span>
          </button>

          <button onClick={() => shareTo('email')} className="flex flex-col items-center gap-1.5 group outline-none">
            <div className="h-11 w-11 rounded-3xl bg-purple-500/10 text-purple-600 flex items-center justify-center transition-all group-hover:bg-purple-600 group-hover:text-white border border-purple-500/10 shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Email</span>
          </button>
        </div>

        <div className="h-px bg-border/40 w-full" />

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-muted-foreground">Page link</label>
          <div className="flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Input
                value={shareUrl}
                readOnly
                className="bg-muted/30 border-border/40 text-muted-foreground rounded-3xl h-10 text-xs w-full truncate"
              />
            </div>
            <Button
              onClick={copyToClipboard}
              className="shrink-0 h-10 rounded-3xl px-4 font-bold text-xs shadow-sm"
              variant={copied ? "default" : "secondary"}
            >
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}