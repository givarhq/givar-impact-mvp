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

    // Parallel fetch: Identity + Security + Discovery Engine Data
    const [user, config, slots, categories] = await Promise.all([
        ApiService.auth.getMe(token),
        ApiService.admin.getConfig(token),
        ApiService.admin.getSlots(token),
        ApiService.projects.getCategories(token)
    ]);

    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
        redirect('/dashboard');
    }

    const defaultConfig = {
        id: 'default',
        recencyWeight: 1.0,
        velocityWeight: 1.5,
        engagementWeight: 1.0,
        adminWeight: 2.0,
        diversityLimit: 3,
        showFundedProjects: false
    };

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="px-1 md:hidden">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Settings</h1>
            </div>

            <div className="w-full min-w-0">
                <AdminSettingsClient
                    user={user}
                    initialConfig={config || defaultConfig}
                    initialSlots={slots || []}
                    categories={categories || []}
                />
            </div>
        </div>
    );
}