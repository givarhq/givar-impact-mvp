import { PublicLayout } from '../../../components/layout/public-layout';
import { AboutContent } from '../../../components/features/about/about-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'Learn about the mission, approach, and the story behind the Givar infrastructure.',
};

export default function AboutPage() {
    return (
        <PublicLayout variant="app">
            <div className="py-4 md:py-8 min-w-0">
                <AboutContent />
            </div>
        </PublicLayout>
    );
}