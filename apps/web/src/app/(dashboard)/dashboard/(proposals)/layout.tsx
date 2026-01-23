'use client';

import { usePathname } from 'next/navigation';
import { FileText, Image as ImageIcon, Briefcase, Shield } from 'lucide-react';
import { cn } from '../../../../lib/utils/cn';

const steps = [
  { href: '/start', name: 'The Hook', icon: FileText, desc: 'Title & Summary' },
  { href: '/media', name: 'The Evidence', icon: ImageIcon, desc: 'Images & Video' },
  { href: '/plan', name: 'The Plan', icon: Briefcase, desc: 'Budget & Timeline' },
  { href: '/trust', name: 'The Trust', icon: Shield, desc: 'KYC & Contacts' },
];

export default function ProposalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Example: /dashboard/proposals/edit/123/media -> /media
  const currentStepPath = `/${pathname.split('/').pop()}`;

  const currentStepIndex = steps.findIndex(step => step.href === currentStepPath);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 min-h-[70vh]">
      
      {/* Sidebar Navigation */}
      <aside className="md:col-span-1">
        <div className="sticky top-24 space-y-2">
            {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                    <div key={step.href} className={cn(
                        "flex items-start gap-4 p-3 rounded-xl transition-all",
                        isActive ? "bg-primary/10" : "opacity-60"
                    )}>
                        <div className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-lg shrink-0",
                            isActive ? "bg-primary text-primary-foreground" : (isCompleted ? "bg-primary/80 text-primary-foreground" : "bg-muted border")
                        )}>
                            <step.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className={cn(
                                "font-semibold text-sm",
                                isActive ? "text-primary" : "text-foreground"
                            )}>
                                {step.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                    </div>
                );
            })}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="md:col-span-3">
        {children}
      </main>
    </div>
  );
}