'use client';

import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, rightElement, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-xs font-bold text-muted-foreground/80 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <input
            type={type}
            className={cn(
              'flex h-10 w-full rounded-3xl border border-border/40 bg-muted/20 px-4 py-2 text-sm transition-all duration-200 outline-none placeholder:text-muted-foreground/50 focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 pr-10',
              error && 'border-destructive/50 focus:ring-destructive/10 focus:border-destructive/40',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-bold text-destructive px-1 animate-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };