import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../services/api';
import { Button } from '../../../../../components/ui/button';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { UserForensicView } from '../../../../../components/features/admin/user-forensic-view';

export default async function AdminUserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) {
        redirect('/login?reason=session_expired');
    }

    // Server-side fetch of the deep user profile
    const user = await ApiService.admin.getUserDetail(token, id);

    if (!user) {
        notFound();
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <Link href="/admin/users">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="pl-0 text-muted-foreground hover:text-foreground group rounded-xl"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to User Directory
                    </Button>
                </Link>

                {user.accountLockedUntil && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-2xl border border-destructive/20 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm animate-pulse">
                        <ShieldAlert className="h-4 w-4" />
                        Administrative Lock Active
                    </div>
                )}
            </div>

            {/* The Main Forensic View Container */}
            <UserForensicView user={user} />
        </div>
    );
}