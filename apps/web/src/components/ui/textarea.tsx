import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        {label && (
          <label className="text-xs font-bold text-muted-foreground/80 ml-1">
            {label}
          </label>
        )}
        <textarea
          className={cn(
            'w-full rounded-3xl border border-border/40 bg-muted/20 px-4 py-2.5 text-sm leading-relaxed transition-all duration-200 outline-none placeholder:text-muted-foreground/50 focus:bg-background focus:ring-2 focus:ring-primary/10 focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-50 resize-none',
            error && 'border-destructive/50 focus:ring-destructive/10 focus:border-destructive/40',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-xs font-bold text-destructive px-1 animate-in slide-in-from-top-1 duration-200">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };