import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { SettingsClient } from '../../../../components/features/settings/settings-client';

export const metadata = {
    title: 'Account Settings',
    description: 'Manage your profile, security, and notification preferences.',
};

export default async function SettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) {
        redirect('/login');
    }

    // Parallel fetch of user identity and organization profile for consolidation
    const [user, orgProfile] = await Promise.all([
        ApiService.auth.getMe(token),
        ApiService.organizations.getMe(token)
    ]);

    if (!user) {
        redirect('/api/auth/clear-session');
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-1 px-1">
                <h1 className="text-lg md:hidden font-black tracking-tight text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Manage your account identity, security protocols, and organization trust.
                </p>
            </div>

            <SettingsClient user={user} orgProfile={orgProfile} />
        </div>
    );
}