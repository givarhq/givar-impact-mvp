'use client';

import React from 'react';
import { AnalyticsStatGrid } from './analytics-stat-grid';
import { FinancialTrendChart } from './financial-trend-chart';
import { ProjectPerformanceCard } from './project-performance-card';
import { SystemIntelFeed } from './system-intel-feed';
import { EvidenceStatusChart } from './evidence-status-chart';
import { OrganizationHealthCard } from './organization-health-card';
import { SectorAllocationCard, EntityCompositionCard } from './metric-cards';

interface AnalyticsOverviewClientProps {
    report: any;
}

export function AnalyticsOverviewClient({ report }: AnalyticsOverviewClientProps) {
    if (!report) return null;

    return (
        <div className="space-y-8 pb-20">
            {/* ROW 1: KPI Stat Grid (Now fully interactive) */}
            <AnalyticsStatGrid
                summary={report.summary}
                avgDonation={report.financials?.avgDonationAmount}
            />

            {/* ROW 2: Financials & Intelligence (The Mix of Graphic and Text) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <FinancialTrendChart
                        data={report.financials.recentTrends}
                        title="Liquidity Velocity"
                        subtitle="Volume vs Frequency (30 Day Trend)"
                    />
                </div>
                <div className="lg:col-span-4">
                    <OrganizationHealthCard metrics={report.organizationMetrics} />
                </div>
            </div>

            {/* ROW 3: Leaderboard & Critical Intel Feed (Direct Action Center) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <ProjectPerformanceCard
                    topFunded={report.projectPerformance.topFunded || []}
                    mostActive={report.projectPerformance.mostActive || []}
                />
                <SystemIntelFeed report={report} />
            </div>

            {/* ROW 4: Auxiliary Operational Context */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <SectorAllocationCard data={report.projectMetrics.categoryDistribution} />
                <EvidenceStatusChart metrics={report.evidenceMetrics} />
                <EntityCompositionCard data={report.userMetrics.accountTypeDistribution} />
            </div>
        </div>
    );
}