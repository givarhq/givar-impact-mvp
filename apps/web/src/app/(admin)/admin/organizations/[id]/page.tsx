import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../services/api';
import { OrganizationDetailView } from '../../../../../components/features/admin/organization-detail-view';
import { Button } from '../../../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Organization detail',
    description: 'Forensic view of legal entity registration and impact history.',
};

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
            notFound();
        }

        return (
            <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-4 px-1">
                    <Link href="/admin/organizations" className="w-fit">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to directory
                        </Button>
                    </Link>

                    <div className="md:hidden">
                        <h1 className="text-xl font-bold tracking-tight text-foreground">Organization detail</h1>
                    </div>
                </div>

                <div className="w-full min-w-0">
                    <OrganizationDetailView profile={profile} />
                </div>
            </div>
        );
    } catch (error) {
        console.error('[AdminOrgDetail] fetch error:', error);
        notFound();
    }
}