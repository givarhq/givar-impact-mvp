import { cookies } from 'next/headers';
import { PublicLayout } from '../../../components/layout/public-layout';
import { HowItWorksContent } from '../../../components/features/how-it-works/how-it-works-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'How It Works',
    description: 'Follow your donation from the moment you give to the moment it creates real impact.',
};

export default async function HowItWorksPage() {
    const cookieStore = await cookies();
    const isAuthenticated = !!cookieStore.get('givar_token')?.value;

    return (
        <PublicLayout variant="app">
            <div className="w-full min-w-0">
                <HowItWorksContent isAuthenticated={isAuthenticated} />
            </div>
        </PublicLayout>
    );
}