import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiService } from '../../../../services/api';
import { AdminSettingsClient } from '../../../../components/features/admin/settings/admin-settings-client';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
    title: 'System Settings | Admin Panel',
    description: 'Configure administrative identity, security protocols, and system preferences.',
};

export default async function AdminSettingsPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) {
        redirect('/login');
    }

    // Fetch the superuser identity and preferences
    const user = await ApiService.auth.getMe(token);

    if (!user || user.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col gap-1 px-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive/80">
                        Admin Root Access
                    </span>
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">System Settings</h1>
                <p className="text-sm text-muted-foreground font-medium">
                    Manage your administrative identity and enforce high-entropy security protocols.
                </p>
            </div>

            <AdminSettingsClient user={user} />
        </div>
    );
}