'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { ModalProps } from '../../types';
import { cn } from '../../lib/utils/cn';

export function Modal({ isOpen, onClose, title, description, children }: ModalProps) {

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-50 w-full max-w-lg scale-100 flex flex-col gap-4 border border-border/40 bg-card p-5 md:p-6 shadow-2xl rounded-3xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 focus:outline-none">
        <div className="flex flex-col space-y-1 pr-8">
          <h2 className="text-lg font-bold leading-tight tracking-tight text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="py-1">
          {children}
        </div>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-3xl opacity-70 transition-opacity hover:opacity-100 disabled:pointer-events-none bg-muted p-1.5 outline-none focus:ring-2 focus:ring-primary/20"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}