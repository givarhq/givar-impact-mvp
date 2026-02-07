'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from './dialog';
import { Button } from './button';
import { ShieldAlert, AlertTriangle, Info, Fingerprint } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive' | 'warning';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'default',
    isLoading = false,
}: ConfirmModalProps) {

    const Icon = {
        default: Info,
        destructive: ShieldAlert,
        warning: AlertTriangle,
    }[variant];

    const theme = {
        default: "text-primary bg-primary/10 border-primary/20",
        destructive: "text-destructive bg-destructive/10 border-destructive/20",
        warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    }[variant];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[420px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-[32px] gap-0">

                {/* Compact Content Area */}
                <div className="p-6 space-y-5">
                    <div className="flex items-start gap-4">
                        <div className={cn("h-12 w-12 rounded-2xl shrink-0 flex items-center justify-center border shadow-inner", theme)}>
                            <Icon className="h-6 w-6" />
                        </div>

                        <div className="space-y-1 pt-1">
                            <DialogHeader className="text-left p-0">
                                <DialogTitle className="text-lg tracking-tight text-foreground leading-none">
                                    {title}
                                </DialogTitle>
                            </DialogHeader>
                            <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Forensic Button Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-12 rounded-2xl font-bold text-sm border-border hover:bg-muted transition-all"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            variant={variant === 'destructive' ? 'destructive' : 'default'}
                            onClick={(e) => {
                                e.preventDefault();
                                onConfirm();
                            }}
                            isLoading={isLoading}
                            className={cn(
                                "h-12 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-95 border-0",
                                variant === 'default' && "shadow-primary/20",
                                variant === 'destructive' && "shadow-destructive/20"
                            )}
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}