'use client';

import React, { useState } from 'react';
import { 
  ShieldAlert, LogIn, CreditCard, Activity, 
  ChevronDown, ChevronRight, FileJson, User 
} from 'lucide-react';
import { formatDate } from '../../../lib/utils/format';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/utils/cn';

const getActionStyle = (action: string) => {
  if (action.includes('LOGIN')) return { icon: LogIn, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' };
  if (action.includes('WALLET') || action.includes('PAYMENT')) return { icon: CreditCard, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
  if (action.includes('FAILED') || action.includes('SUSPEND')) return { icon: ShieldAlert, color: 'text-destructive', bg: 'bg-destructive/10' };
  return { icon: Activity, color: 'text-muted-foreground', bg: 'bg-secondary' };
};

export function AuditTable({ logs }: { logs: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (logs.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/20">
            <ShieldAlert className="h-10 w-10 mb-4 opacity-20" />
            <p>No audit logs found matching criteria.</p>
        </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border">
            <tr>
                <th className="px-6 py-4 font-medium w-[50px]"></th>
                <th className="px-6 py-4 font-medium">Actor</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Target</th>
                <th className="px-6 py-4 font-medium text-right">Timestamp</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-border">
            {logs.map((log) => {
                const style = getActionStyle(log.action);
                const Icon = style.icon;
                const isExpanded = expandedId === log.id;

                return (
                <React.Fragment key={log.id}>
                    <tr 
                        onClick={() => toggleExpand(log.id)}
                        className={cn(
                            "cursor-pointer transition-colors group",
                            isExpanded ? "bg-muted/30" : "hover:bg-muted/20"
                        )}
                    >
                    <td className="px-6 py-4">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />}
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground border border-border/50">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <div className="font-semibold text-foreground">
                                    {log.user?.email || 'System / Guest'}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono mt-0.5">
                                    {log.ipAddress}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <Badge variant="secondary" className={cn("gap-1.5 pr-2.5 font-medium border-0", style.bg, style.color)}>
                            <Icon className="h-3.5 w-3.5" />
                            {log.action.replace(/_/g, ' ')}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                        <span className="font-medium text-foreground">{log.entityType}</span>
                        <div className="font-mono text-xs mt-0.5 opacity-70">{log.entityId?.split('-')[0]}...</div>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground text-xs font-mono tabular-nums">
                        {formatDate(log.createdAt)}
                    </td>
                    </tr>
                    
                    {isExpanded && (
                        <tr className="bg-muted/10 shadow-inner">
                            <td colSpan={5} className="px-6 py-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <FileJson className="h-4 w-4" /> Event Metadata
                                        </h4>
                                        <div className="bg-zinc-950 text-zinc-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800 shadow-sm relative">
                                            <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-sm bg-background border border-border p-4 rounded-xl">
                                        <div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Log ID</span>
                                            <span className="font-mono select-all bg-secondary px-2 py-1 rounded text-foreground">{log.id}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">User Agent</span>
                                            <span className="text-xs break-all text-foreground bg-secondary px-2 py-1 rounded block leading-relaxed">{log.userAgent}</span>
                                        </div>
                                        <div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Full Entity ID</span>
                                            <span className="font-mono select-all bg-secondary px-2 py-1 rounded text-foreground">{log.entityId}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    )}
                </React.Fragment>
                );
            })}
            </tbody>
        </table>
      </div>
    </div>
  );
}