import * as React from 'react';
import { cn } from '../../lib/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground/80">
            {label}
          </label>
        )}
        <input
          type={type}
          // SOTA: Changed rounded-lg to rounded-xl
          className={cn(
            'flex h-11 w-full rounded-xl border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            error && 'border-destructive focus-visible:ring-destructive/30',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-[0.8rem] font-medium text-destructive animate-in slide-in-from-top-1 fade-in-0">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };