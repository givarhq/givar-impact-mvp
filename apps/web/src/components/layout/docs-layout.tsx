'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Menu, X, FileText, ChevronRight, ShieldCheck, Clock, Ban, Users, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { getCookie } from 'cookies-next';
import { cn } from '../../lib/utils/cn';
import { Input } from '../ui/input';
import { Footer } from './footer';
import { motion, AnimatePresence } from 'framer-motion';

const docsNav = [
    { title: 'Privacy Policy', href: '/legal/privacy', icon: ShieldCheck },
    { title: 'Terms of Service', href: '/legal/terms', icon: FileText },
    { title: 'Refund Policy', href: '/legal/refund', icon: Clock },
    { title: 'Cancellation Policy', href: '/legal/cancellation', icon: Ban },
    { title: 'Cause Organiser Agreement', href: '/legal/agreement', icon: Users },
    { title: 'Partner Agreement', href: '/legal/partner-agreement', icon: HeartHandshake },
    { title: 'Acceptable Use Policy', href: '/legal/acceptable-use', icon: ShieldCheck },
];

export function DocsLayout({ children, initialDocs = [] }: { children: React.ReactNode; initialDocs?: any[] }) {
    const router = useRouter();
    const pathname = usePathname();
    const [backLink, setBackLink] = useState('/explore');
    const [desktopQuery, setDesktopQuery] = useState('');
    const [mobileQuery, setMobileQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    useEffect(() => {
        const token = getCookie('givar_token');
        if (token) {
            setBackLink('/dashboard');
        }
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen || isMobileSearchOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen, isMobileSearchOpen]);

    const handleBack = (e: React.MouseEvent) => {
        e.preventDefault();
        if (typeof window !== 'undefined' && document.referrer && document.referrer.includes(window.location.host)) {
            router.back();
        } else {
            router.push(backLink);
        }
    };

    // Reconstruct the search index dynamically from live database records
    const searchCorpus = initialDocs.map((doc: any) => ({
        title: doc.title,
        href: `/legal/${doc.slug}`,
        content: (doc.title + ' ' + doc.content)
            .replace(/<[^>]*>?/gm, ' ')
            .replace(/&nbsp;/g, ' ')
            .trim()
    }));

    const SearchResults = ({ query, onNavigate, className }: { query: string, onNavigate: (href: string) => void, className?: string }) => {
        const lowerQuery = query.toLowerCase();
        const results = searchCorpus.filter(doc =>
            doc.title.toLowerCase().includes(lowerQuery) ||
            doc.content.toLowerCase().includes(lowerQuery)
        );

        if (!query) return null;

        const renderSnippet = (content: string) => {
            const matchIndex = content.toLowerCase().indexOf(lowerQuery);
            if (matchIndex === -1) return content.slice(0, 80) + '...';

            const start = Math.max(0, matchIndex - 40);
            const end = Math.min(content.length, matchIndex + query.length + 40);
            let snippet = content.slice(start, end).trim();

            if (start > 0) snippet = '...' + snippet;
            if (end < content.length) snippet = snippet + '...';

            const parts = snippet.split(new RegExp(`(${query})`, 'gi'));
            return (
                <>
                    {parts.map((part, i) =>
                        part.toLowerCase() === lowerQuery ? (
                            <span key={i} className="text-primary font-bold bg-primary/10 px-0.5 rounded-[4px]">{part}</span>
                        ) : (
                            <span key={i}>{part}</span>
                        )
                    )}
                </>
            );
        };

        return (
            <div className={cn("bg-card border border-border/40 rounded-3xl shadow-xl overflow-hidden z-50", className)}>
                {results.length > 0 ? (
                    <div className="py-2">
                        {results.map(res => (
                            <button key={res.href} onClick={() => onNavigate(res.href)} className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-foreground truncate">{res.title}</p>
                                        <p className="text-xs text-muted-foreground font-medium line-clamp-2 mt-0.5 break-words leading-relaxed">
                                            {renderSnippet(res.content)}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:opacity-100 transition-opacity shrink-0 ml-3" />
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-sm text-muted-foreground font-medium">
                        No documents found matching the search term.
                    </div>
                )}
            </div>
        );
    };

    const handleNavigate = (href: string) => {
        router.push(href);
        setDesktopQuery('');
        setMobileQuery('');
        setIsMobileSearchOpen(false);
        setIsMobileMenuOpen(false);
    };

    const NavLinks = () => (
        <nav className="flex flex-col w-full">
            {docsNav.map(item => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-5 py-3 transition-all duration-200 text-sm w-full",
                            isActive
                                ? "border-l-[3px] border-primary bg-primary/5 text-primary font-bold"
                                : "border-l-[3px] border-transparent text-foreground font-medium hover:bg-muted/30"
                        )}
                    >
                        {isActive ? <CheckCircle2 className="h-4.5 w-4.5" /> : <Icon className="h-4.5 w-4.5 text-muted-foreground" />}
                        {item.title}
                    </Link>
                );
            })}
        </nav>
    );

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">

            {/* Mobile Header */}
            <div className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 -ml-1 text-foreground active:scale-95 transition-transform">
                        <Menu className="h-6 w-6" />
                    </button>
                    <Link href="/" className="flex items-center gap-1.5 ml-1">
                        <Image src="/Givar1.png" alt="Givar Logo" width={22} height={22} className="object-contain" />
                        <span className="font-bold text-base tracking-tight text-foreground">
                            Givar<span className="text-primary">.</span>
                        </span>
                    </Link>
                    <span className="text-muted-foreground/30 mx-1">|</span>
                    <span className="font-bold text-sm tracking-tight text-foreground">Legal Docs</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsMobileSearchOpen(true)} className="p-2 bg-muted/30 rounded-full text-foreground active:scale-95 transition-transform">
                        <Search className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-sm bg-card border-r border-border/40 shadow-2xl overflow-y-auto md:hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 pb-2">
                                <button onClick={handleBack} className="flex items-center text-sm font-bold text-primary hover:text-primary/80 transition-colors group w-fit outline-none bg-transparent border-0 p-0 m-0 cursor-pointer">
                                    <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> Back to Givar
                                </button>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-muted/50 rounded-full text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="px-6 py-6 border-b border-border/40 mb-2">
                                <h3 className="text-lg font-bold text-foreground mb-1">Legal Documents</h3>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">All policies and agreements that govern the use of Givar.</p>
                            </div>

                            <div className="flex-1 w-full">
                                <NavLinks />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Mobile Search Overlay */}
            <AnimatePresence>
                {isMobileSearchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-50 bg-background flex flex-col md:hidden"
                    >
                        <div className="p-4 border-b border-border/40 flex items-center gap-3 bg-card">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    autoFocus
                                    placeholder="Search documentation..."
                                    value={mobileQuery}
                                    onChange={e => setMobileQuery(e.target.value)}
                                    className="pl-11 h-12 rounded-3xl bg-muted/20 border-transparent focus:bg-background text-sm font-medium"
                                />
                            </div>
                            <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 relative bg-background">
                            {mobileQuery ? (
                                <div className="w-full">
                                    <SearchResults query={mobileQuery} onNavigate={handleNavigate} className="w-full" />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 space-y-3">
                                    <Search className="h-12 w-12" />
                                    <p className="text-sm font-medium">Type to search legal documents</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="w-[300px] shrink-0 border-r border-border/40 h-screen sticky top-0 overflow-y-auto hidden md:block bg-card/50">
                <div className="flex flex-col h-full w-full py-8">
                    <div className="px-8 mb-10">
                        <button onClick={handleBack} className="inline-flex items-center text-sm font-bold text-primary hover:text-primary/80 transition-colors group outline-none bg-transparent border-0 p-0 m-0 cursor-pointer">
                            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> Back to Givar
                        </button>
                    </div>

                    <div className="px-8 mb-6">
                        <h3 className="text-lg font-bold text-foreground mb-2">Legal Documents</h3>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">All policies and agreements that govern the use of Givar.</p>
                    </div>

                    <div className="w-full">
                        <NavLinks />
                    </div>
                </div>
            </aside>

            {/* Main Content Area & Footer Wrapper */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
                <main className="flex-1 flex justify-center">
                    <div className="w-full max-w-4xl p-6 md:p-10 lg:p-16">

                        {/* Desktop Search */}
                        <div className="hidden md:block relative mb-12">
                            <div className="relative group min-w-0">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <Search className="h-4 w-4" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search specific terms or paragraphs..."
                                    className="w-full bg-secondary/50 hover:bg-secondary focus:bg-background border border-transparent focus:border-primary/30 rounded-3xl py-2.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-muted-foreground/70 text-foreground font-medium shadow-sm"
                                    value={desktopQuery}
                                    onChange={(e) => setDesktopQuery(e.target.value)}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {desktopQuery && (
                                        <button onClick={() => setDesktopQuery('')} className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors outline-none active:scale-95">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <SearchResults query={desktopQuery} onNavigate={handleNavigate} className="absolute top-full left-0 right-0 mt-2" />
                        </div>

                        {/* Document Content Slot */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {children}
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}