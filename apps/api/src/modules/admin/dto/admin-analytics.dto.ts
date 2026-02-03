import { Currency, ProjectStatus, UserRole, VerificationStatus, AccountType } from '@givar/database';

export class AdminAnalyticsResponseDto {
    summary: {
        totalUsers: number;
        userGrowthPercent: number;
        totalVolume: Record<Currency, string>;
        activeProjects: number;
        pendingKycCount: number;
        unresolvedSuspenseCount: number;
    };

    financials: {
        avgDonationAmount: string;
        successRate: number;
        currencyDistribution: Array<{ currency: Currency; total: string; count: number }>;
        recentTrends: Array<{
            date: string;
            volume: string;
            donations: number;
        }>;
    };

    // CONSOLIDATED PROJECT METRICS
    projectMetrics: {
        topFunded: Array<{
            id: string;
            title: string;
            raised: string;
            target: string;
            percent: number
        }>;
        mostActive: Array<{
            id: string;
            title: string;
            donationCount: number;
            uniqueDonors: number;
        }>;
        categoryDistribution: Array<{ category: string; count: number; volume: string }>;
        statusBreakdown: Array<{ status: ProjectStatus; count: number }>;
    };

    proposalMetrics: {
        totalDrafts: number;
        totalSubmitted: number;
        totalApproved: number;
        totalRejected: number;
        approvalRate: number;
        funnel: Array<{ stage: string; count: number }>;
    };

    evidenceMetrics: {
        totalSubmitted: number;
        pending: number;
        approved: number;
        rejected: number;
        verificationRate: number;
        statusDistribution: Array<{ status: string; count: number }>;
    };

    organizationMetrics: {
        totalEntities: number;
        verifiedCount: number;
        pendingCount: number;
        rejectedCount: number;
        activeOrganizers: number;
    };

    userMetrics: {
        roleDistribution: Array<{ role: UserRole; count: number }>;
        accountTypeDistribution: Array<{ type: AccountType; count: number }>;
        verificationFunnel: {
            unverified: number;
            pending: number;
            verified: number;
        };
        newUsersTrend: Array<{ date: string; count: number }>;
    };
}