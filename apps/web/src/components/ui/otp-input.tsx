'use client';

import React, { useRef, KeyboardEvent, useEffect } from 'react';
import { cn } from '../../lib/utils/cn';

interface OtpInputProps {
    value: string;
    onChange: (value: string) => void;
    maxLength: number;
    disabled?: boolean;
    className?: string;
}

export function OtpInput({ value, onChange, maxLength, disabled, className }: OtpInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Auto-focus the first empty input box when mounted (if not disabled)
        if (!disabled && inputRefs.current[0]) {
            const firstEmptyIndex = value.length < maxLength ? value.length : maxLength - 1;
            // Slight delay to ensure modal transitions are complete before hijacking focus
            setTimeout(() => inputRefs.current[firstEmptyIndex]?.focus(), 100);
        }
    }, [disabled]); // Removed value from dependency array to prevent stealing focus on every type

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        // Strictly restrict to digits only
        if (!/^\d*$/.test(val)) return;

        const char = val.slice(-1);
        if (char) {
            const newValue = value.split('');
            newValue[index] = char;
            onChange(newValue.join(''));

            // Auto-advance focus to the next input box
            if (index < maxLength - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newValue = value.split('');

            if (newValue[index]) {
                // Clear current box
                newValue[index] = '';
                onChange(newValue.join(''));
            } else if (index > 0) {
                // Clear previous box and jump back
                newValue[index - 1] = '';
                onChange(newValue.join(''));
                inputRefs.current[index - 1]?.focus();
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < maxLength - 1) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, maxLength);

        if (pastedData) {
            onChange(pastedData);
            // Advance focus to the last filled box
            const focusIndex = Math.min(pastedData.length, maxLength - 1);
            setTimeout(() => inputRefs.current[focusIndex]?.focus(), 10);
        }
    };

    return (
        <div className={cn("flex items-center justify-center gap-2 sm:gap-3 w-full", className)}>
            {Array.from({ length: maxLength }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    disabled={disabled}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className={cn(
                        "w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-2xl",
                        "bg-muted/20 border border-border/60 text-foreground",
                        "focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
                        "transition-all duration-200 outline-none shadow-sm",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                />
            ))}
        </div>
    );
}