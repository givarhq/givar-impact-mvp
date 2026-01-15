'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';
import { cn } from '../../../lib/utils/cn';

interface PortfolioItem {
  id: string;
  amount: string; // User's donation
  currency: string;
  project: {
    title: string;
    slug: string;
    imageUrl: string | null;
    targetAmount: string;
    raisedAmount: string;
    currency: string;
    status: string;
  };
}

export function ImpactPortfolio({ items }: { items: PortfolioItem[] }) {
  if (items.length === 0) return null;

  return (
    <Card className="col-span-1 lg:col-span-2 h-full flex flex-col overflow-hidden border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> 
                Your Impact Portfolio
            </CardTitle>
            <Link href="/dashboard/history" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                View Full History <ArrowRight className="h-3 w-3" />
            </Link>
        </div>
      </CardHeader>
      
      <div className="grid gap-4">
        {items.map((item) => {
          // Calculate Project Health
          const raised = Number(item.project.raisedAmount);
          const target = Number(item.project.targetAmount);
          const percent = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
          const isFunded = percent >= 100;

          return (
            <Link 
                key={item.id} 
                href={`/dashboard/impact/${item.project.slug}`}
                className="group block"
            >
                <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 group-hover:-translate-y-0.5">
                    
                    {/* Background Progress Bar (Subtle) */}
                    <div 
                        className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-1000" 
                        style={{ width: `${percent}%` }} 
                    />
                    
                    <div className="flex items-center gap-4">
                        {/* Project Thumbnail */}
                        <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 relative">
                            {item.project.imageUrl ? (
                                <img src={item.project.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5" />
                            )}
                            {isFunded && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-sm text-foreground truncate pr-4 group-hover:text-primary transition-colors">
                                    {item.project.title}
                                </h4>
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                    {percent.toFixed(0)}% Funded
                                </span>
                            </div>
                            
                            <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <span>You contributed:</span>
                                    <span className="font-medium text-foreground">
                                        <SmartCurrency 
                                            amount={item.amount} 
                                            currency={item.currency} 
                                            visible={true} 
                                            size="default" // Will default to standard size
                                            className="text-xs" 
                                        />
                                    </span>
                                </div>
                                
                                {isFunded ? (
                                    <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        Goal Met
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground text-[10px]">
                                        Target: <SmartCurrency amount={item.project.targetAmount} currency={item.project.currency} visible={true} className="text-[10px]" />
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}