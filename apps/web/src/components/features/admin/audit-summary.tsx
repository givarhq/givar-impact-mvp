'use client';

import { Activity, ShieldAlert, Fingerprint } from 'lucide-react';
import { Card } from '../../ui/card';

interface AuditSummaryProps {
  stats: {
    total24h: number;
    failedLogins24h: number;
    highRisk24h: number;
  };
}

export function AuditSummary({ stats }: AuditSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-5 bg-card border-border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
        <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Events (24h)</p>
            <h3 className="text-3xl font-bold text-foreground mt-1">{stats.total24h}</h3>
        </div>
        <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity className="h-6 w-6" />
        </div>
      </Card>

      <Card className="p-5 bg-card border-border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
        <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Failed Logins</p>
            <h3 className="text-3xl font-bold text-foreground mt-1">{stats.failedLogins24h}</h3>
        </div>
        <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
            <ShieldAlert className="h-6 w-6" />
        </div>
      </Card>

      <Card className="p-5 bg-card border-border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
        <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">High Risk Ops</p>
            <h3 className="text-3xl font-bold text-foreground mt-1">{stats.highRisk24h}</h3>
        </div>
        <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-500">
            <Fingerprint className="h-6 w-6" />
        </div>
      </Card>
    </div>
  );
}