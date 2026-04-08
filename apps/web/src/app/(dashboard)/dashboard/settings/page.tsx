import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { SettingsClient } from '../../../../components/features/settings/settings-client';

export const metadata = {
    title: 'Settings',
    description: 'Manage your profile, identity documents, security, & notification preferences.',
};

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) {
        redirect('/login');
    }

    // --- GHOST FIX: Removed the API call to fetch subscriptions entirely ---
    const [user, orgProfile] = await Promise.all([
        ApiService.auth.getMe(token),
        ApiService.organizations.getMe(token)
    ]);

    if (!user) {
        redirect('/api/auth/clear-session');
    }

    return (
        <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="w-full min-w-0">
                <SettingsClient
                    user={user}
                    orgProfile={orgProfile}
                />
            </div>
        </div>
    );
}