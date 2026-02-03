import { cookies } from 'next/headers';
import { ApiService } from '../../../services/api';
import { AnalyticsOverviewClient } from '../../../components/features/admin/analytics/analytics-overview-client';
import { Lock, LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground animate-in fade-in">
            <Lock className="h-10 w-10 mb-4 opacity-20" />
            <p className="font-bold text-sm uppercase tracking-widest">Secure Session Required</p>
        </div>
    );

    // Fetch granular analytics payload
    const analyticsReport = await ApiService.admin.getAnalytics(token);

    if (!analyticsReport) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
                <p>Analytics engine unavailable.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Clean Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <LayoutDashboard className="h-6 w-6 text-primary hidden md:block" />
                        Platform Overview
                    </h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        Command center operational intelligence.
                    </p>
                </div>
            </div>

            {/* Main Dashboard Engine */}
            <AnalyticsOverviewClient report={analyticsReport} />
        </div>
    );
}