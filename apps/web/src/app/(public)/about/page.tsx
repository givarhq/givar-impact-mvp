import { PublicLayout } from '../../../components/layout/public-layout';
import { AboutContent } from '../../../components/features/about/about-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'Learn about the mission, approach, and the story behind the Givar infrastructure.',
};

export default function AboutPage() {
    return (
        <PublicLayout>
            <div className="px-4 sm:px-6 pt-2 pb-14 min-w-0 w-full">
                <AboutContent />
            </div>
        </PublicLayout>
    );
}