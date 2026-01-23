'use client';

import { useState } from 'react';
import { 
  ShieldAlert, LogIn, CreditCard, Activity, 
  ChevronDown, ChevronRight, FileJson, User 
} from 'lucide-react';
import { formatDate } from '../../../lib/utils/format';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { cn } from '../../../lib/utils/cn';

// Helper to map actions to visuals
const getActionStyle = (action: string) => {
  if (action.includes('LOGIN')) return { icon: LogIn, color: 'text-blue-500', bg: 'bg-blue-500/10' };
  if (action.includes('WALLET') || action.includes('PAYMENT')) return { icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  if (action.includes('FAILED') || action.includes('SUSPEND')) return { icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' };
  return { icon: Activity, color: 'text-zinc-500', bg: 'bg-zinc-500/10' };
};

export function AuditTable({ logs }: { logs: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (logs.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <ShieldAlert className="h-10 w-10 mb-4 opacity-20" />
            <p>No audit logs found.</p>
        </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-muted/50 text-muted-foreground border-b border-border">
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
              <>
                <tr 
                    key={log.id} 
                    onClick={() => toggleExpand(log.id)}
                    className={cn(
                        "cursor-pointer transition-colors group",
                        isExpanded ? "bg-muted/30" : "hover:bg-muted/30"
                    )}
                >
                  <td className="px-6 py-4">
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground border border-border">
                            <User className="h-4 w-4" />
                        </div>
                        <div>
                            <div className="font-medium text-foreground">
                                {log.user?.email || 'System / Guest'}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                                {log.ipAddress}
                            </div>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className={cn("gap-1.5 pr-2.5", style.bg, style.color, "border-0")}>
                        <Icon className="h-3 w-3" />
                        {log.action.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {log.entityType}: <span className="font-mono text-xs">{log.entityId?.split('-')[0]}...</span>
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground text-xs font-mono">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
                
                {/* Expanded Details Row */}
                {isExpanded && (
                    <tr className="bg-muted/10">
                        <td colSpan={5} className="px-6 py-4 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <FileJson className="h-4 w-4" /> Metadata
                                    </h4>
                                    <pre className="bg-zinc-950 text-zinc-300 p-4 rounded-xl text-xs font-mono overflow-x-auto border border-zinc-800">
                                        {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                </div>
                                <div className="space-y-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Log ID:</span> <br/>
                                        <span className="font-mono select-all">{log.id}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">User Agent:</span> <br/>
                                        <span className="text-xs break-all">{log.userAgent}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Full Entity ID:</span> <br/>
                                        <span className="font-mono select-all">{log.entityId}</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}