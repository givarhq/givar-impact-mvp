import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../services/api';
import { OrganizationDetailView } from '../../../../../components/features/admin/organization-detail-view';
import { Button } from '../../../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function AdminOrganizationDetailPage({
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

    try {
        const profile = await ApiService.organizations.getOrganizationById(token, id);

        if (!profile) {
            console.error(`[AdminOrgDetail] Organization record not found: ${id}`);
            notFound();
        }

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <Link href="/admin/organizations">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="pl-0 text-muted-foreground hover:text-foreground group rounded-xl"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Directory
                        </Button>
                    </Link>
                </div>

                <OrganizationDetailView profile={profile} />
            </div>
        );
    } catch (error) {
        console.error('[AdminOrgDetail] Data fetch error:', error);
        notFound();
    }
}