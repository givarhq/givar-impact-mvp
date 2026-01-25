'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';

interface PortfolioItem {
  id: string;
  amount: string; 
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
    <Card className="col-span-1 lg:col-span-2 h-full flex flex-col overflow-hidden border-none shadow-none bg-transparent min-w-0">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2 min-w-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" /> 
                <span className="truncate">Your Portfolio</span>
            </CardTitle>
            <Link 
              href="/dashboard/history" 
              className="text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 shrink-0 bg-muted/50 px-2 py-1 rounded-lg border border-border/50"
            >
                History <ArrowRight className="h-3 w-3" />
            </Link>
        </div>
      </CardHeader>
      
      <div className="grid gap-3 sm:gap-4 w-full">
        {items.map((item) => {
          const raised = Number(item.project.raisedAmount);
          const target = Number(item.project.targetAmount);
          const percent = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
          const isFunded = percent >= 100;

          return (
            <Link 
                key={item.id} 
                href={`/dashboard/impact/${item.project.slug}`}
                className="group block w-full min-w-0"
            >
                <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-3 sm:p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
                    <div className="absolute bottom-0 left-0 h-1 bg-primary/10 transition-all duration-1000" style={{ width: `${percent}%` }} />
                    
                    <div className="flex items-center gap-3 sm:gap-4 w-full min-w-0">
                        {/* Thumbnail */}
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-muted overflow-hidden shrink-0 relative border border-border/50">
                            {item.project.imageUrl ? (
                                <img src={item.project.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5" />
                            )}
                            {isFunded && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                </div>
                            )}
                        </div>

                        {/* Details - min-w-0 is key to allow truncation */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-row justify-between items-center mb-1 gap-2">
                                <h4 className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                                    {item.project.title}
                                </h4>
                                <span className="text-[9px] sm:text-[10px] font-bold text-primary bg-primary/5 px-1 rounded shrink-0">
                                    {percent.toFixed(0)}%
                                </span>
                            </div>
                            
                            <div className="flex flex-row justify-between items-center gap-2">
                                <div className="flex items-center gap-1 text-muted-foreground truncate text-[10px] sm:text-xs">
                                    <span className="font-bold text-foreground">
                                        <SmartCurrency 
                                            amount={item.amount} 
                                            currency={item.currency} 
                                            visible={true} 
                                            size="small"
                                            className="text-[10px] sm:text-xs" 
                                        />
                                    </span>
                                </div>
                                
                                {isFunded ? (
                                    <span className="text-emerald-500 font-bold text-[9px] uppercase tracking-wider shrink-0">
                                        Goal Met
                                    </span>
                                ) : (
                                    <div className="text-muted-foreground text-[9px] shrink-0 truncate">
                                        Goal: <SmartCurrency amount={item.project.targetAmount} currency={item.project.currency} visible={true} size="small" className="text-[9px]" />
                                    </div>
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