'use client';

import React, { ReactNode } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from './dialog';
import { Button } from './button';
import { ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils/cn';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string | ReactNode; // <-- updated to accept JSX
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
        default: "text-primary bg-primary/10 border-primary/10",
        destructive: "text-destructive bg-destructive/10 border-destructive/10",
        warning: "text-amber-600 bg-amber-50 border-amber-100",
    }[variant];

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl bg-card rounded-3xl gap-0 z-[100]">
                <div className="p-5 md:p-6 flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                        <div
                            className={cn(
                                "h-11 w-11 rounded-2xl flex items-center justify-center border shadow-sm shrink-0",
                                theme
                            )}
                        >
                            <Icon className="h-6 w-6" />
                        </div>

                        <div className="space-y-1 pt-0.5 min-w-0">
                            <DialogHeader className="p-0 text-left">
                                <DialogTitle className="text-base font-bold tracking-tight text-foreground leading-tight">
                                    {title}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="text-sm text-muted-foreground font-medium leading-relaxed">
                                {/* Render either string or JSX */}
                                {typeof description === 'string' ? (
                                    <p className="break-words">{description}</p>
                                ) : (
                                    description
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-12 rounded-3xl font-bold text-sm text-muted-foreground hover:bg-muted border border-border/40 transition-all min-w-0 overflow-hidden whitespace-nowrap text-ellipsis truncate"
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
                            className="h-12 rounded-3xl font-bold text-sm shadow-lg shadow-primary/10 border-0 transition-all min-w-0 overflow-hidden whitespace-nowrap text-ellipsis truncate"
                        >
                            {confirmText}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}