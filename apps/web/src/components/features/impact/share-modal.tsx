'use client';

import React, { useState, memo } from 'react';
import { Copy, Check, Mail, Instagram, Facebook, Twitter } from 'lucide-react';
import { Modal } from '../../ui/modal';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import toast from 'react-hot-toast';
import { usePostHog } from 'posthog-js/react';
import { calculatePhaseFunding } from '@givar/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: any;
  // Legacy props for backward compatibility during refactoring
  projectTitle?: string;
  projectSlug?: string;
  isFunded?: boolean;
}

export const ShareModal = memo(function ShareModal({ isOpen, onClose, project, projectTitle, projectSlug, isFunded: legacyIsFunded = false }: ShareModalProps) {
  const posthog = usePostHog();
  const [copied, setCopied] = useState(false);

  const title = project?.title || projectTitle || '';
  const slug = project?.slug || projectSlug || '';

  const phaseMath = project ? calculatePhaseFunding(project) : null;

  const isSuspended = project?.status === 'SUSPENDED';
  const isCompleted = phaseMath?.isCompleted || false;
  const isFunded = phaseMath?.isFundedState || (!project && legacyIsFunded);
  const isPhaseFull = phaseMath?.isPhaseFull || false;

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/explore/${slug}`
    : '';

  // Dynamic share text based on the project's funding and moderation status
  let shareText = `Join me in supporting '${title}' on Givar. Transparent, verified, and direct impact.`;
  let modalDesc = `Help us reach more donors by sharing this cause with your network.`;
  let emailSubj = `Support ${title} on Givar`;
  let emailBody = `Join me in supporting ${title} on Givar. It's transparent and impactful.`;

  if (isSuspended) {
    shareText = `Check out this cause on Givar: ${title}. Note: This cause is currently under administrative review.`;
    modalDesc = `Share this cause to review the public ledger.`;
    emailSubj = `Cause under review: ${title}`;
    emailBody = `Check out the public ledger and updates for ${title} on Givar.`;
  } else if (isCompleted) {
    shareText = `Impact achieved! The cause '${title}' has been successfully executed and verified on Givar.`;
    modalDesc = `Celebrate this verified impact by sharing with your network.`;
    emailSubj = `Impact achieved for ${title}`;
    emailBody = `See how ${title} was successfully executed and verified on Givar.`;
  } else if (isFunded || isPhaseFull) {
    shareText = `Goal reached! The current stage for '${title}' is fully funded on Givar. Track execution progress.`;
    modalDesc = `Share this milestone as vendor execution begins.`;
    emailSubj = `Goal reached for ${title}`;
    emailBody = `The current stage for ${title} is fully funded! Track execution progress on Givar.`;
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied');
    posthog?.capture('project_shared', { platform: 'clipboard', project_slug: slug });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTo = (platform: string) => {
    let url = '';
    switch (platform) {
      case 'instagram':
        navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied! Paste it in your Instagram bio or story.');
        posthog?.capture('project_shared', { platform, project_slug: slug });
        onClose();
        return; // Exit early as IG does not support web share URLs
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'x':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&via=givarapp`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(emailSubj)}&body=${encodeURIComponent(emailBody + '\n\n' + shareUrl)}`;
        break;
    }

    posthog?.capture('project_shared', { platform, project_slug: slug });

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share this cause"
      description={modalDesc}
    >
      <div className="space-y-5 pt-3">

        <div className="grid grid-cols-4 gap-3">
          <button onClick={() => shareTo('instagram')} className="flex flex-col items-center gap-1.5 group outline-none active:scale-95 transition-transform">
            <div className="h-11 w-11 rounded-3xl bg-pink-500/10 text-pink-600 flex items-center justify-center transition-all group-hover:bg-pink-600 group-hover:text-white border border-pink-500/10 shadow-sm">
              <Instagram className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Instagram</span>
          </button>

          <button onClick={() => shareTo('facebook')} className="flex flex-col items-center gap-1.5 group outline-none active:scale-95 transition-transform">
            <div className="h-11 w-11 rounded-3xl bg-blue-600/10 text-blue-600 flex items-center justify-center transition-all group-hover:bg-blue-600 group-hover:text-white border border-blue-600/10 shadow-sm">
              <Facebook className="h-5 w-5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">Facebook</span>
          </button>

          <button onClick={() => shareTo('x')} className="flex flex-col items-center gap-1.5 group outline-none active:scale-95 transition-transform">
            <div className="h-11 w-11 rounded-3xl bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 flex items-center justify-center transition-all group-hover:bg-black group-hover:text-white border border-zinc-500/10 shadow-sm">
              <Twitter className="h-4.5 w-4.5" />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">X</span>
          </button>

          <button onClick={() => shareTo('email')} className="flex flex-col items-center gap-1.5 group outline-none active:scale-95 transition-transform">
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
              className="shrink-0 h-10 rounded-3xl px-4 font-bold text-xs shadow-sm active:scale-95 transition-transform"
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
});