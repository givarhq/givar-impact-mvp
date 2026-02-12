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
        <div className="space-y-6 md:space-y-8 pb-20 animate-in fade-in duration-500">
            {/* KPI Stat Grid */}
            <AnalyticsStatGrid
                summary={report.summary}
                avgDonation={report.financials?.avgDonationAmount}
            />

            {/* Main Financial & Operational Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <FinancialTrendChart
                        data={report.financials.recentTrends}
                        title="Liquidity velocity"
                        subtitle="Volume vs frequency (30 day trend)"
                    />
                </div>
                <div className="lg:col-span-4">
                    <OrganizationHealthCard metrics={report.organizationMetrics} />
                </div>
            </div>

            {/* Performance & Intel Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6">
                    <ProjectPerformanceCard
                        topFunded={report.projectPerformance.topFunded || []}
                        mostActive={report.projectPerformance.mostActive || []}
                    />
                </div>
                <div className="lg:col-span-6">
                    <SystemIntelFeed report={report} />
                </div>
            </div>

            {/* Distribution Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <SectorAllocationCard data={report.projectMetrics.categoryDistribution} />
                </div>
                <div className="lg:col-span-4">
                    <EvidenceStatusChart metrics={report.evidenceMetrics} />
                </div>
                <div className="lg:col-span-4">
                    <EntityCompositionCard data={report.userMetrics.accountTypeDistribution} />
                </div>
            </div>
        </div>
    );
}