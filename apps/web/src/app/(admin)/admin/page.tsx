import { cookies } from 'next/headers';
import { ApiService } from '../../../services/api';
import { AnalyticsOverviewClient } from '../../../components/features/admin/analytics/analytics-overview-client';
import { Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground p-6">
            <div className="h-16 w-16 bg-muted rounded-3xl flex items-center justify-center mb-4 border border-border/40">
                <Lock className="h-8 w-8 opacity-20" />
            </div>
            <p className="font-bold text-xs  tracking-[0.2em]">Secure Session Required</p>
        </div>
    );

    // Fetch granular analytics payload from API
    const analyticsReport = await ApiService.admin.getAnalytics(token);

    if (!analyticsReport) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
                <p className="text-sm font-medium">Analytics engine unavailable.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 px-1">
                    <h1 className="text-lg md:hidden font-bold tracking-tight text-foreground flex items-center gap-3">
                        Platform Overview
                    </h1>
                </div>
            </div>

            <AnalyticsOverviewClient report={analyticsReport} />
        </div>
    );
}