'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '../../../../lib/utils/cn';
import { Check } from 'lucide-react';
import { useProposalAutoSave } from '../../../../hooks/use-proposal-auto-save';

const steps = [
  { href: '/hook', name: 'The Hook', number: 1 },
  { href: '/media', name: 'Media & Proof', number: 2 },
  { href: '/plan', name: 'Execution Plan', number: 3 },
  { href: '/trust', name: 'Verification', number: 4 },
];

export default function ProposalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentStepPath = `/${pathname.split('/').pop()}`;
  const currentStepIndex = steps.findIndex((step) => step.href === currentStepPath);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;
  useProposalAutoSave();

  return (
    <div className="min-h-screen bg-background">
      {/* Compact horizontal stepper – sticky on mobile */}
      <nav
        aria-label="Progress"
        className={cn(
          "sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-border/50",
          "px-3 sm:px-6 lg:px-8 py-3 md:py-4"
        )}
      >
        <div className="mx-auto max-w-4xl">
          <ol role="list" className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < activeIndex;
              const isCurrent = index === activeIndex;
              const isFuture = index > activeIndex;
              const isLast = index === steps.length - 1;

              return (
                <li
                  key={step.name}
                  className="relative flex flex-col items-center flex-1"
                >
                  {/* Connector line – spans between circle centers */}
                  {!isLast && (
                    <div
                      className={cn(
                        "absolute top-4 h-0.5 md:h-[2px] -translate-y-1/2",
                        "left-[calc(50%+1rem)] right-[calc(-50%+1rem)] md:left-[calc(50%+1.5rem)] md:right-[calc(-50%+1.5rem)]",
                        isCompleted ? "bg-primary" : "bg-muted/70"
                      )}
                    />
                  )}

                  <Link
                    href={`/dashboard/proposals/edit${step.href}`}
                    className={cn(
                      "relative z-10 flex flex-col items-center transition-opacity duration-200",
                      isFuture ? "opacity-50" : "opacity-100"
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-disabled={isFuture}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-200",
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : isCurrent
                          ? "border-primary bg-background text-primary shadow-[0_0_0_4px_rgba(16,185,129,0.15)] ring-1 ring-primary/30"
                          : "border-muted-foreground/50 bg-muted/40 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? <Check className="h-4 w-4 md:h-5 md:w-5" /> : step.number}
                    </div>

                    {/* Step name – full text, no truncation */}
                    <span
                      className={cn(
                        "mt-1.5 text-[10px] md:text-xs font-medium text-center leading-tight",
                        "whitespace-normal",
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* Main content area */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <div
          className={cn(
            "rounded-2xl border bg-card shadow-sm",
            "border-border/40 shadow-primary/5",
            "p-5 sm:p-7 md:p-9"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}