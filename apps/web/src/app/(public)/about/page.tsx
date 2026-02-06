import { PublicLayout } from '../../../components/layout/public-layout';
import { AboutContent } from '../../../components/features/about/about-content';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us | Givar',
    description: 'Givar is humanizing the way the world gives through transparency and verified impact.',
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