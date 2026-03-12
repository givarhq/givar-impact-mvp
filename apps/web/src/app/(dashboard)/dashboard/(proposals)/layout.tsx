'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '../../../../lib/utils/cn';
import { Check } from 'lucide-react';
import { useProposalAutoSave } from '../../../../hooks/use-proposal-auto-save';
import { motion } from 'framer-motion';
import { usePostHog } from 'posthog-js/react';
import { FeedbackThread } from '../../../../components/features/communication/feedback-thread';
import { useEffect } from 'react';

const steps = [
  { href: '/hook', name: 'Hook', number: 1 },
  { href: '/media', name: 'Media', number: 2 },
  { href: '/plan', name: 'Use of Funds', number: 3 },
  { href: '/trust', name: 'Trust', number: 4 },
];

export default function ProposalLayout({ children }: { children: React.ReactNode }) {
  const posthog = usePostHog();
  const pathname = usePathname();
  const isEditPage = pathname.includes('/edit/');

  const segments = pathname.split('/');
  const editIndex = segments.indexOf('edit');
  const proposalId = editIndex !== -1 ? segments[editIndex + 1] : null;

  const currentStepPath = `/${pathname.split('/').pop()}`;
  const currentStepIndex = steps.findIndex((step) => step.href === currentStepPath);
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  useEffect(() => {
    if (isEditPage && proposalId) {
      posthog?.capture('proposal_step_viewed', {
        proposal_id: proposalId,
        step_name: steps[activeIndex].name,
        step_number: steps[activeIndex].number
      });
    }
  }, [activeIndex, proposalId, isEditPage]);

  useProposalAutoSave();

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-hidden">
      {isEditPage && (
        <nav
          aria-label="Progress"
          className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-border/40 px-4 py-4"
        >
          <div className="mx-auto w-full max-w-3xl min-w-0">
            <ol role="list" className="flex items-center justify-between w-full min-w-0">
              {steps.map((step, index) => {
                const isCompleted = index < activeIndex;
                const isCurrent = index === activeIndex;
                const isFuture = index > activeIndex;
                const isLast = index === steps.length - 1;
                const targetHref = `/dashboard/proposals/edit/${proposalId}${step.href}`;

                return (
                  <li
                    key={step.name}
                    className={cn(
                      "relative flex items-center min-w-0",
                      !isLast && "flex-1"
                    )}
                  >
                    <Link
                      href={isFuture ? '#' : targetHref}
                      className={cn(
                        "relative z-10 flex flex-col items-center transition-all duration-200 min-w-0",
                        isFuture ? "opacity-40 cursor-not-allowed" : "hover:opacity-80"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-3xl border-2 text-xs font-bold transition-all duration-300",
                          isCompleted
                            ? "bg-primary border-primary text-primary-foreground"
                            : isCurrent
                              ? "border-primary bg-background text-primary shadow-sm ring-4 ring-primary/5"
                              : "border-border/60 bg-muted/30 text-muted-foreground"
                        )}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : step.number}
                      </div>
                      <span
                        className={cn(
                          "absolute top-9 whitespace-nowrap text-[11px] font-bold  tracking-widest transition-colors",
                          isCurrent ? "text-primary" : "text-muted-foreground/60"
                        )}
                      >
                        {step.name}
                      </span>
                    </Link>

                    {!isLast && (
                      <div className="flex-1 h-0.5 mx-2 md:mx-4 bg-muted/40 rounded-3xl overflow-hidden min-w-0">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: isCompleted ? "100%" : "0%" }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>
      )}

      <main
        className={cn(
          "mx-auto w-full max-w-full sm:max-w-3xl md:max-w-5xl px-2 sm:px-4 md:px-6 lg:px-8 pb-24 md:pb-16 transition-all min-w-0",
          isEditPage ? "pt-6" : "pt-6"
        )}
      >
        <div className="min-w-0 w-full space-y-12">
          <div className="min-w-0 w-full">
            {children}
          </div>

          {isEditPage && proposalId && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <FeedbackThread
                proposalId={proposalId}
                title="Verification Updates"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}