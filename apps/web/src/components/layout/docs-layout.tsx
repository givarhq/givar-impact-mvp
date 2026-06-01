'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Menu, X, FileText, ChevronRight } from 'lucide-react';
import { getCookie } from 'cookies-next';
import { cn } from '../../lib/utils/cn';
import { Input } from '../ui/input';
import { motion, AnimatePresence } from 'framer-motion';

const docsNav = [
    { title: 'Privacy Policy', href: '/legal/privacy' },
    { title: 'Terms of Service', href: '/legal/terms' },
    { title: 'Refund Policy', href: '/legal/refund' },
    { title: 'Cancellation Policy', href: '/legal/cancellation' },
    { title: 'Cause Organiser Agreement', href: '/legal/agreement' },
    { title: 'Partner Agreement', href: '/legal/partner-agreement' },
    { title: 'Acceptable Use Policy', href: '/legal/acceptable-use' },
];

const searchCorpus = [
    { title: 'Privacy Policy', href: '/legal/privacy', keywords: 'data collect security personal private information retention cookie' },
    { title: 'Terms of Service', href: '/legal/terms', keywords: 'rules platform liability prohibited conduct account terms dispute' },
    { title: 'Refund Policy', href: '/legal/refund', keywords: 'refund return money error exception finality gateway payment' },
    { title: 'Cancellation Policy', href: '/legal/cancellation', keywords: 'cancellation policy cancel withdraw pause remove cause intervention suspend' },
    { title: 'Cause Organiser Agreement', href: '/legal/agreement', keywords: 'organiser obligations consent beneficiary phased updates agreement contract' },
    { title: 'Partner Agreement', href: '/legal/partner-agreement', keywords: 'vendor partner services payout return funds institutional execution' },
    { title: 'Acceptable Use Policy', href: '/legal/acceptable-use', keywords: 'acceptable permitted prohibited fraudulent verified rules compliance' }
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
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

    // Prevent body scroll when mobile modals are open
    useEffect(() => {
        if (isMobileMenuOpen || isMobileSearchOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isMobileMenuOpen, isMobileSearchOpen]);

    const SearchResults = ({ query, onNavigate }: { query: string, onNavigate: (href: string) => void }) => {
        const results = searchCorpus.filter(doc =>
            doc.title.toLowerCase().includes(query.toLowerCase()) ||
            (doc.keywords && doc.keywords.includes(query.toLowerCase()))
        );

        if (!query) return null;

        return (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/40 rounded-3xl shadow-xl overflow-hidden z-50">
                {results.length > 0 ? (
                    <div className="py-2">
                        {results.map(res => (
                            <button key={res.href} onClick={() => onNavigate(res.href)} className="w-full text-left px-4 py-3 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{res.title}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:opacity-100 transition-opacity" />
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
        <nav className="flex flex-col gap-1">
            {docsNav.map(item => {
                const isActive = pathname === item.href;
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                            "flex items-center gap-3 px-4 py-2.5 transition-all duration-200 rounded-3xl",
                            isActive
                                ? "bg-primary/10 text-primary font-bold shadow-sm"
                                : "text-muted-foreground hover:bg-muted/30 hover:text-foreground font-medium"
                        )}
                    >
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
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 -ml-1 text-foreground active:scale-95 transition-transform">
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="font-bold text-base tracking-tight text-foreground">Legal Documents</span>
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
                            className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm bg-card border-r border-border/40 shadow-2xl p-6 overflow-y-auto md:hidden"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <span className="font-bold text-lg text-foreground">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-muted/50 rounded-full text-muted-foreground hover:text-foreground active:scale-95 transition-all">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <Link href={backLink} className="flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group w-fit">
                                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> Back to platform
                            </Link>
                            <h3 className="text-xs font-bold text-muted-foreground mb-3 px-4 tracking-tight">Legal Documents</h3>
                            <NavLinks />
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
                                    <SearchResults query={mobileQuery} onNavigate={handleNavigate} />
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
            <aside className="w-72 shrink-0 border-r border-border/40 h-screen sticky top-0 overflow-y-auto hidden md:block bg-card">
                <div className="p-6 md:p-8">
                    <Link href={backLink} className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-10 group">
                        <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" /> Back to platform
                    </Link>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xs font-bold text-muted-foreground mb-4 px-4 tracking-tight">Legal Documents</h3>
                            <NavLinks />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex justify-center">
                <div className="w-full max-w-4xl p-6 md:p-10 lg:p-16">

                    {/* Desktop Search */}
                    <div className="hidden md:block relative mb-12">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search documentation..."
                                value={desktopQuery}
                                onChange={e => setDesktopQuery(e.target.value)}
                                className="h-14 pl-14 rounded-full bg-muted/10 border-border/40 focus:bg-background text-sm shadow-sm transition-all font-medium"
                            />
                        </div>
                        <SearchResults query={desktopQuery} onNavigate={handleNavigate} />
                    </div>

                    {/* Document Content Slot */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}