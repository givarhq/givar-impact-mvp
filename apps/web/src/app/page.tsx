import { LandingHeader } from '../components/layout/landing-header';
import { HeroSection } from '../components/features/landing/hero-section';
import { Footer } from '../components/layout/footer';
import { ApiService } from '../services/api';

async function getLandingStats() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/projects/stats/platform`, {
            next: { revalidate: 60 },
        });
        if (!res.ok) return { totalVolume: '0', latestDonation: null };
        return res.json();
    } catch (error) {
        return { totalVolume: '0', latestDonation: null };
    }
}

export default async function LandingPage() {
    let featuredProjects = [];
    try {
        const response = await ApiService.recommendations.getFeatured();
        featuredProjects = response?.data || [];
    } catch (error) {
        console.error("Discovery engine unavailable for landing hydration");
    }

    const stats = await getLandingStats();

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-background text-foreground font-sans selection:bg-primary/20 transition-colors duration-300">

            <LandingHeader />

            <main className="overflow-hidden">
                <HeroSection featuredProjects={featuredProjects} stats={stats} />
            </main>

            <Footer />
        </div>
    );
}