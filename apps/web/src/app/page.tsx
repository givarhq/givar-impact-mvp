import { LandingHeader } from '../components/layout/landing-header';
import { HeroSection, FeatureSection } from '../components/features/landing/hero-section';
import { ArrowRight, Github, Twitter, Linkedin, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../components/ui/button';

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
    const stats = await getLandingStats();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      
      <LandingHeader />
      
      <main>
        <HeroSection stats={stats} />
        <FeatureSection />
        
        <section className="py-32 relative overflow-hidden bg-black text-white">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15),transparent_70%)]" />
             
             <div className="container mx-auto px-6 relative z-10 text-center">
                 <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight max-w-3xl mx-auto leading-tight">
                     Ready to deploy your <br />
                     <span className="text-primary">philanthropic capital?</span>
                 </h2>
                 <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto mb-12">
                     Join the network of modern givers. Zero friction. 100% Transparency. Real-time Impact.
                 </p>
                 
                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/signup">
                        <Button size="lg" className="h-16 px-12 rounded-full bg-primary text-white hover:bg-primary/90 font-bold text-lg shadow-[0_0_40px_hsl(var(--primary)/0.4)] transition-all hover:scale-105">
                            <CreditCard className="mr-2 h-6 w-6" /> Start Giving Now <ArrowRight className="ml-2 h-6 w-6" />
                        </Button>
                    </Link>
                 </div>
             </div>
        </section>
      </main>

      <footer className="bg-zinc-50 border-t border-zinc-200 py-16">
        <div className="container mx-auto px-6">
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
                        <span className="text-xl font-bold text-zinc-900">Givar.</span>
                    </div>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                        The operating system for modern philanthropy. We provide the infrastructure for transparent, verifiable, and frictionless giving.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                    <div>
                        <h4 className="font-bold text-zinc-900 mb-4">Product</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><Link href="#" className="hover:text-primary transition-colors">Wallets</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Ledger</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">API</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-zinc-900 mb-4">Company</h4>
                        <ul className="space-y-3 text-sm text-zinc-500">
                            <li><Link href="#" className="hover:text-primary transition-colors">Manifesto</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div className="border-t border-zinc-200 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-zinc-400">
                <div>&copy; {new Date().getFullYear()} Givar Inc.</div>
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