import { PublicLayout } from '../../../../components/layout/public-layout';
import { Metadata } from 'next';
import { PartnerForm } from './partner-form';

export const metadata: Metadata = {
    title: 'Partner With Givar',
    description: 'Tell us a little about your organisation and explore how we can work together.',
};

export default function PartnerWithGivarPage() {
    return (
        <PublicLayout>
            <div className="w-full min-w-0 overflow-hidden bg-[#fafafa] dark:bg-background relative">
                {/* Decorative Background Accents */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

                <div className="container mx-auto px-4 md:px-6 pt-6 md:pt-10 pb-20 relative z-10">
                    <PartnerForm />
                </div>
            </div>
        </PublicLayout>
    );
}