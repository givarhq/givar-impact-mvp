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
      <Card className="p-4 bg-zinc-900 border-zinc-800 flex items-center justify-between">
        <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Events (24h)</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.total24h}</h3>
        </div>
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Activity className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-4 bg-zinc-900 border-zinc-800 flex items-center justify-between">
        <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Failed Logins</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.failedLogins24h}</h3>
        </div>
        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
            <ShieldAlert className="h-5 w-5" />
        </div>
      </Card>

      <Card className="p-4 bg-zinc-900 border-zinc-800 flex items-center justify-between">
        <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">High Risk Ops</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.highRisk24h}</h3>
        </div>
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Fingerprint className="h-5 w-5" />
        </div>
      </Card>
    </div>
  );
}