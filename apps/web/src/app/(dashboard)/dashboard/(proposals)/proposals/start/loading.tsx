import { Loader2 } from 'lucide-react';

export default function StartProposalLoading() {
    return (
        <div className="max-w-5xl mx-auto min-w-0 animate-in fade-in duration-500 pt-2 pb-20">
            <div className="flex flex-col items-center justify-center min-h-[400px] border border-border/40 bg-card rounded-3xl shadow-sm space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Loading Workspace...</p>
            </div>
        </div>
    );
}