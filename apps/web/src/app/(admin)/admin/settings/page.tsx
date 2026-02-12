import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { AdminSettingsClient } from '../../../../components/features/admin/settings/admin-settings-client';

export const metadata = {
    title: 'System settings',
    description: 'Configure administrative identity, security protocols, and system preferences.',
};

export default async function AdminSettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) {
        redirect('/login');
    }

    const user = await ApiService.auth.getMe(token);

    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
        redirect('/dashboard');
    }

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Mobile page title */}
            <div className="px-1 md:hidden">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Account Settings</h1>
            </div>

            <div className="w-full min-w-0">
                <AdminSettingsClient user={user} />
            </div>
        </div>
    );
}