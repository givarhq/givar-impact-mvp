import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { SettingsClient } from '../../../../components/features/settings/settings-client';

export const metadata = {
    title: 'Account Settings',
    description: 'Manage your profile, identity documents, security, and notification preferences.',
};

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) {
        redirect('/login');
    }

    const [user, orgProfile] = await Promise.all([
        ApiService.auth.getMe(token),
        ApiService.organizations.getMe(token)
    ]);

    if (!user) {
        redirect('/api/auth/clear-session');
    }

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">

            <div className="w-full min-w-0">
                <SettingsClient user={user} orgProfile={orgProfile} />
            </div>
        </div>
    );
}