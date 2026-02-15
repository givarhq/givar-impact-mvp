import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { VisibilityControlClient } from '../../../../components/features/admin/visibility/visibility-control-client';

export const metadata = {
    title: 'Visibility Control',
    description: 'Manage recommendation weights, algorithmic discovery, and featured cause slots.',
};

export default async function AdminVisibilityPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get('givar_token')?.value;

    if (!token) return null;

    // Parallel fetch of configuration and current featured slots
    const [config, slots, categories] = await Promise.all([
        ApiService.admin.getConfig(token),
        ApiService.admin.getSlots(token),
        ApiService.projects.getCategories(token)
    ]);

    return (
        <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="md:hidden px-1">
                <h1 className="text-xl font-bold tracking-tight text-foreground">Visibility Control</h1>
            </div>

            <div className="w-full min-w-0">
                <VisibilityControlClient
                    initialConfig={config}
                    initialSlots={slots || []}
                    categories={categories || []}
                />
            </div>
        </div>
    );
}