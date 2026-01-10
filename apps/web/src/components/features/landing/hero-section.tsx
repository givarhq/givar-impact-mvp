'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Wallet, ShieldCheck, Activity, PlayCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

export function HeroSection() {
  return (
    <div className="relative min-h-[90vh] w-full flex flex-col justify-end overflow-hidden bg-black">
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <Image 
            src="/Givar3.png" 
            alt="Givar Impact" 
            fill 
            className="object-cover opacity-90 scale-105 animate-in fade-in duration-1000"
            priority
        />
        {/* Cinematic Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
      </div>

      {/* CONTENT LAYER */}
      <div className="relative z-10 container mx-auto px-6 pb-20 md:pb-32 pt-32">
        <div className="max-w-3xl space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-100">
          
          {/* SOTA Typography */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white leading-[0.95]">
            Transparency is <br />
            the new <span className="text-primary">currency.</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-300 max-w-xl leading-relaxed font-light">
            Don't just give. Invest in impact. The first philanthropy protocol that tracks every cent from your wallet to the project's execution.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/signup">
                <Button className="h-14 px-8 rounded-full bg-white text-black hover:bg-zinc-200 font-bold text-base transition-transform hover:scale-105 active:scale-95">
                   Create Impact Wallet
                </Button>
            </Link>
            <Button variant="ghost" className="h-14 px-8 rounded-full text-white hover:bg-white/10 border border-white/20 backdrop-blur-sm gap-2">
               <PlayCircle className="h-5 w-5" /> Watch Manifesto
            </Button>
          </div>
        </div>

        {/* FLOATING GLASS STATS */}
        <div className="absolute right-6 bottom-10 hidden lg:block animate-in fade-in slide-in-from-right-10 duration-1000 delay-300">
            <Card className="w-80 border-white/10 bg-black/40 backdrop-blur-xl p-5 text-white shadow-2xl rounded-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                        <Activity className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-xs text-zinc-400 font-medium">Real-time Volume</p>
                        <p className="text-lg font-bold font-mono">₦ 42,000,000</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-400">Clean Water Project</span>
                        <span className="text-primary">+ ₦50,000</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[70%]" />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
                        <span>Just now</span>
                        <span>Verified on-chain</span>
                    </div>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
}

export function FeatureSection() {
    const features = [
        {
            icon: Wallet,
            title: "Smart Wallets",
            desc: "Segregate your funds. Automate recurring donations. Manage giving like a portfolio."
        },
        {
            icon: ShieldCheck,
            title: "Zero-Knowledge Trust",
            desc: "Projects prove impact without exposing sensitive beneficiary data. Security meets transparency."
        },
        {
            icon: Activity,
            title: "Direct Routing",
            desc: "No middlemen. Funds move from your wallet to the project's verified account instantly."
        }
    ];

    return (
        <div id="features" className="py-24 bg-zinc-50 relative">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl font-bold tracking-tight text-zinc-900 mb-4">Why Givar?</h2>
                        <p className="text-zinc-500 text-lg">Traditional charity is a black box. We built a glass house.</p>
                    </div>
                    <Link href="/signup">
                        <Button variant="link" className="text-primary font-semibold p-0 h-auto hover:no-underline group">
                            Explore the tech <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </Link>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((f, i) => (
                        <div key={i} className="group p-8 rounded-3xl bg-white border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-300">
                            <div className="h-14 w-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 mb-6 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-colors">
                                <f.icon className="h-7 w-7" />
                            </div>
                            <h3 className="text-xl font-bold mb-3 text-zinc-900">{f.title}</h3>
                            <p className="text-zinc-500 leading-relaxed">
                                {f.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}