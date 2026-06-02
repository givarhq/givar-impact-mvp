import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { AdminSettingsClient } from '../../../../components/features/admin/settings/admin-settings-client';

export const metadata = {
    title: 'Settings',
    description: 'Configure administrative identity, security protocols, & discovery engine weights.',
};

export default async function AdminSettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) {
        redirect('/login');
    }

    // Parallel fetch: Identity + Security + Discovery + Fee Governance + Legal Docs
    const [user, config, slots, categories, currentFee, feeHistory, legalDocs] = await Promise.all([
        ApiService.auth.getMe(token),
        ApiService.admin.getConfig(token),
        ApiService.admin.getSlots(token),
        ApiService.projects.getCategories(token),
        ApiService.fees.getAdminCurrent(token).catch(() => null),
        ApiService.fees.getHistory(token).catch(() => []),
        ApiService.legalDocs.adminGetAll(token).catch(() => [])
    ]);

    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
        redirect('/dashboard');
    }

    const defaultConfig = {
        id: 'default',
        recencyWeight: 5.0,
        velocityWeight: 7.0,
        engagementWeight: 3.0,
        adminWeight: 4.0,
        diversityLimit: 3,
        showFundedProjects: false
    };

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="px-1 md:hidden">
                <h1 className="text-lg font-bold tracking-tight text-foreground">Settings</h1>
            </div>

            <div className="w-full min-w-0">
                <AdminSettingsClient
                    user={user}
                    initialConfig={config || defaultConfig}
                    initialSlots={slots || []}
                    categories={categories || []}
                    initialFeeRule={currentFee}
                    initialFeeHistory={feeHistory || []}
                    initialLegalDocs={legalDocs || []}
                />
            </div>
        </div>
    );
}