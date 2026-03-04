import { PublicLayout } from '../../../components/layout/public-layout';
import { AboutContent } from '../../../components/features/about/about-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | Givar',
    description: 'Learn about the mission, approach, and the story behind the Givar Impact infrastructure.',
};

export default function AboutPage() {
    return (
        <PublicLayout>
            <div className="container mx-auto px-4 py-12 md:py-24">
                <AboutContent />
            </div>
        </PublicLayout>
    );
}