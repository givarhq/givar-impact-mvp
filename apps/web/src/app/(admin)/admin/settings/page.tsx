import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { AdminSettingsClient } from '../../../../components/features/admin/settings/admin-settings-client';

export const metadata = {
    title: 'System Settings',
    description: 'Configure administrative identity, security protocols, and system preferences.',
};

export default async function AdminSettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) {
        redirect('/login');
    }

    const user = await ApiService.auth.getMe(token);

    if (!user || user.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-1 px-1">
                <h1 className="text-xl md:hidden font-black tracking-tight text-foreground">System Settings</h1>
            </div>

            <AdminSettingsClient user={user} />
        </div>
    );
}