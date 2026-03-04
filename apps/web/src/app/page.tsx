import { LandingHeader } from '../components/layout/landing-header';
import { HeroSection } from '../components/features/landing/hero-section';
import { Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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

            <footer className="bg-white dark:bg-zinc-950 border-t border-border/40 py-16 transition-colors duration-300">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                        <div className="space-y-6 max-w-sm">
                            <div className="flex items-center gap-2">
                                <div className="relative h-10 w-10">
                                    <Image
                                        src="/Givar1.png"
                                        alt="Givar Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <span className="text-xl font-bold text-foreground">Givar.</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                The operating system for modern philanthropy. We provide the infrastructure for transparent, verifiable, and frictionless giving.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                            <div>
                                <h4 className="font-bold text-foreground mb-4">Product</h4>
                                <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                                    <li><Link href="/docs/wallets" className="hover:text-primary transition-colors">Smart Wallets</Link></li>
                                    <li><Link href="/docs/records" className="hover:text-primary transition-colors">Public Records</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold text-foreground mb-4">Company</h4>
                                <ul className="space-y-3 text-sm font-medium text-muted-foreground">
                                    <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                                    <li><Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link></li>
                                    <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                                    <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border/40 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium text-muted-foreground">
                        <div>&copy; {new Date().getFullYear()} Givar Inc. All rights reserved.</div>
                        <div className="flex gap-6">
                            <Github className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
                            <Twitter className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
                            <Linkedin className="h-5 w-5 hover:text-primary cursor-pointer transition-colors" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}