'use client';

import React from 'react';
import { AnalyticsStatGrid } from './analytics-stat-grid';
import { FinancialTrendChart } from './financial-trend-chart';
import { ProjectPerformanceCard } from './project-performance-card';
import { ProposalFunnelChart } from './proposal-funnel-chart';
import { EvidenceStatusChart } from './evidence-status-chart';
import { OrganizationHealthCard } from './organization-health-card';
import { SectorAllocationCard, EntityCompositionCard } from './metric-cards';

interface AnalyticsOverviewClientProps {
    report: any;
}

export function AnalyticsOverviewClient({ report }: AnalyticsOverviewClientProps) {
    if (!report) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            {/* ROW 1: KPI Stat Grid */}
            {/* FIX: Only depend on summary. avgDonation is now optional within the component. */}
            {report.summary && (
                <AnalyticsStatGrid
                    summary={report.summary}
                    avgDonation={report.financials?.avgDonationAmount}
                />
            )}

            {/* ROW 2: Financials & Organization Health */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    {report.financials?.recentTrends && (
                        <FinancialTrendChart
                            data={report.financials.recentTrends}
                            title="Liquidity Velocity"
                            subtitle="Volume vs Frequency (30 Day Trend)"
                        />
                    )}
                </div>
                <div className="lg:col-span-4">
                    {report.organizationMetrics && (
                        <OrganizationHealthCard metrics={report.organizationMetrics} />
                    )}
                </div>
            </div>

            {/* ROW 3: Project & Proposal Deep Dive */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {report.projectPerformance && (
                    <ProjectPerformanceCard
                        topFunded={report.projectPerformance.topFunded || []}
                        mostActive={report.projectPerformance.mostActive || []}
                    />
                )}
                {report.proposalMetrics && (
                    <ProposalFunnelChart
                        funnel={report.proposalMetrics.funnel || []}
                        totalDrafts={report.proposalMetrics.totalDrafts || 0}
                        approvalRate={report.proposalMetrics.approvalRate || 0}
                    />
                )}
            </div>

            {/* ROW 4: Operational Metrics & Evidence */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {report.projectMetrics?.categoryDistribution && (
                    <SectorAllocationCard data={report.projectMetrics.categoryDistribution} />
                )}
                {report.evidenceMetrics && (
                    <EvidenceStatusChart metrics={report.evidenceMetrics} />
                )}
                {report.userMetrics?.accountTypeDistribution && (
                    <EntityCompositionCard data={report.userMetrics.accountTypeDistribution} />
                )}
            </div>
        </div>
    );
}