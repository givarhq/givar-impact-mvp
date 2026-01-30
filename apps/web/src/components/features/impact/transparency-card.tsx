'use client';

import { useState } from 'react';
import { ShieldCheck, TrendingUp, Users, AlertCircle, ArrowRight, X, Copy, Check } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { SmartCurrency } from '../../ui/smart-currency';
import { Project } from '../../../types';
import { cn } from '../../../lib/utils/cn';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface TransparencyCardProps {
  project: Project & { donorCount?: number };
}

export function TransparencyCard({ project }: TransparencyCardProps) {
  const raised = BigInt(project.raisedAmount || '0');
  const target = BigInt(project.targetAmount || '0');
  
  const remaining = raised >= target ? 0n : target - raised;
  
  const percent = target > 0n 
    ? Number((raised * 100n) / target)
    : 0;

  const barWidth = Math.min(100, percent);

  const [expandedCard, setExpandedCard] = useState<'goal' | 'remaining' | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleExpand = (card: 'goal' | 'remaining') => {
    setExpandedCard(prev => prev === card ? null : card);
  };

  const copyIdToClipboard = () => {
    navigator.clipboard.writeText(project.slug);
    setCopied(true);
    toast.success("Project ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-b from-primary/20 via-border/50 to-transparent">
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-xl border-none rounded-[15px] p-6 shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold tracking-wider">Verified Ledger</span>
            </div>
            
            {/* Copyable ID */}
            <div 
                onClick={copyIdToClipboard}
                className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors group/copy"
                title="Click to copy ID"
            >
                <span>ID: {project.slug.slice(0, 10)}...</span>
                {copied ? (
                    <Check className="h-3 w-3 text-emerald-500 animate-in zoom-in" />
                ) : (
                    <Copy className="h-3 w-3 opacity-0 -ml-3 group-hover/copy:opacity-100 group-hover/copy:ml-0 transition-all duration-300" />
                )}
            </div>
        </div>

        {/* Main Stat (Raised) */}
        <div className="space-y-1 mb-6">
            <p className="text-sm font-medium text-muted-foreground">Total Raised</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-4xl font-bold tracking-tight text-foreground">
                    <SmartCurrency amount={raised.toString()} currency={project.currency} visible={true} size="large" />
                </h3>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-8">
            <div className="flex justify-between text-xs font-semibold">
                <span className="text-primary">{percent}% Funded</span>
                <span className="text-muted-foreground">Target</span>
            </div>
            <div className="h-4 w-full bg-secondary/50 rounded-full overflow-hidden p-0.5 border border-border/50">
                <div 
                    className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                    style={{ width: `${barWidth}%` }}
                />
            </div>
        </div>

        {/* Interactive Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6 transition-all duration-300 ease-spring">

            {/* GOAL CARD */}
            {expandedCard !== 'remaining' && (
                <div
                    onClick={() => toggleExpand('goal')}
                    className={cn(
                        "p-3 rounded-xl bg-background/50 border border-border/50 cursor-pointer hover:bg-background/80 transition-all select-none",
                        expandedCard === 'goal' ? "col-span-2 border-primary/50 bg-primary/5" : "col-span-1"
                    )}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground">Goal</span>
                        </div>
                        {expandedCard === 'goal' && <X className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <p className={cn("font-semibold text-sm", expandedCard !== 'goal' && "truncate")}>
                        <SmartCurrency 
                            amount={target.toString()} 
                            currency={project.currency} 
                            visible={true} 
                            size="default" 
                        />
                    </p>
                </div>
            )}

            {/* REMAINING CARD */}
            {expandedCard !== 'goal' && (
                <div
                    onClick={() => toggleExpand('remaining')}
                    className={cn(
                        "p-3 rounded-xl bg-background/50 border border-border/50 cursor-pointer hover:bg-background/80 transition-all select-none",
                        expandedCard === 'remaining' ? "col-span-2 border-amber-500/50 bg-amber-500/5" : "col-span-1"
                    )}
                >
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                            <span className="text-xs font-medium text-muted-foreground">Remaining</span>
                        </div>
                        {expandedCard === 'remaining' && <X className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <p className={cn("font-semibold text-sm text-amber-600 dark:text-amber-400", expandedCard !== 'remaining' && "truncate")}>
                        <SmartCurrency 
                            amount={remaining.toString()} 
                            currency={project.currency} 
                            visible={true} 
                            size="default" 
                        />
                    </p>
                </div>
            )}

            {/* Donors */}
            <div className="col-span-2 p-3 rounded-xl bg-background/50 border border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs font-medium text-muted-foreground">Unique Donors</span>
                </div>
                <p className="font-semibold text-sm">{project.donorCount || 0}</p>
            </div>
        </div>

        {/* Ledger Link */}
        <Link href={`/dashboard/history?search=${encodeURIComponent(project.title)}`}>
            <Button variant="outline" className="w-full rounded-xl border-dashed border-border hover:bg-muted/50 text-xs h-9">
                View Public Ledger <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
        </Link>

      </Card>
    </div>
  );
}