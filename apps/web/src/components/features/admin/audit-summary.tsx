'use client';

import React, { memo } from 'react';
import { Activity, ShieldAlert, Fingerprint, Globe } from 'lucide-react';
import { Card } from '../../ui/card';
import { cn } from '../../../lib/utils/cn';
import { motion } from 'framer-motion';

interface AuditSummaryProps {
  stats: {
    total24h: number;
    failedLogins24h: number;
    highRisk24h: number;
    uniqueActors24h?: number;
  };
}

export const AuditSummary = memo(function AuditSummary({ stats }: AuditSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 w-full min-w-0">
      <SummaryCard
        label="Total Events"
        value={stats.total24h}
        subValue="Last 24 Hours"
        icon={Activity}
        color="text-blue-500"
        bg="bg-blue-500/10"
        delay={0}
      />
      <SummaryCard
        label="Failed Logins"
        value={stats.failedLogins24h}
        subValue="Security Threats"
        icon={ShieldAlert}
        color="text-destructive"
        bg="bg-destructive/10"
        delay={0.1}
      />
      <SummaryCard
        label="High Risk Ops"
        value={stats.highRisk24h}
        subValue="Admin Overrides"
        icon={Fingerprint}
        color="text-amber-600"
        bg="bg-amber-500/10"
        delay={0.2}
      />
      <SummaryCard
        label="Actors"
        value={stats.uniqueActors24h || 0}
        subValue="Active Identities"
        icon={Globe}
        color="text-purple-500"
        bg="bg-purple-500/10"
        delay={0.3}
      />
    </div>
  );
});

function SummaryCard({ label, value, subValue, icon: Icon, color, bg, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="h-full min-w-0"
    >
      <Card className="relative p-3.5 md:p-5 bg-card overflow-hidden rounded-3xl transition-all duration-300 group h-full flex flex-col justify-between border-border/40 shadow-sm">
        <div className="relative z-10 space-y-3 md:space-y-4 min-w-0">
          <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
            <div className={cn(
              "h-8 w-8 md:h-9 md:w-9 rounded-2xl flex items-center justify-center shadow-sm border border-transparent shrink-0 transition-transform group-hover:scale-110",
              bg, color
            )}>
              <Icon className="h-4 md:h-4.5 w-4 md:w-4.5" />
            </div>
            <p className="text-xs md:text-sm font-bold text-muted-foreground/80 leading-tight truncate">
              {label}
            </p>
          </div>

          <div className="space-y-0.5 min-w-0">
            <div className="text-lg md:text-2xl font-bold text-foreground tracking-tight leading-none truncate tabular-nums">
              {value.toLocaleString()}
            </div>
            <p className="text-[10px] md:text-xs font-medium text-muted-foreground truncate opacity-80 leading-tight">
              {subValue}
            </p>
          </div>
        </div>

        <div className={cn(
          "absolute -bottom-2 -right-2 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none",
          color
        )}>
          <Icon className="h-16 w-16 md:h-20 md:w-20 rotate-12" />
        </div>
      </Card>
    </motion.div>
  );
}