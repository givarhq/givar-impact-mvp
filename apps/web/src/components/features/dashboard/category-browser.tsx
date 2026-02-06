'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Compass, Droplets, Book, Zap, Heart, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

const iconMap = {
    water: Droplets,
    education: Book,
    power: Zap,
    health: Heart,
    emergency: Shield,
    default: Compass,
};

interface CategoryBrowserProps {
    categories: Array<{ id: string; name: string; slug: string; icon?: string }>;
    selected: string;
    onSelect: (slug: string) => void;
}

export function CategoryBrowser({ categories, selected, onSelect }: CategoryBrowserProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const allCategories = [
        { id: 'all', name: 'All', slug: 'all' },
        ...categories
    ];

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [categories]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 240;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const resolveIcon = (name: string, slug: string) => {
        const str = `${name} ${slug}`.toLowerCase();
        if (str.includes('water') || str.includes('clean')) return iconMap.water;
        if (str.includes('edu') || str.includes('school') || str.includes('book')) return iconMap.education;
        if (str.includes('power') || str.includes('electric') || str.includes('energy') || str.includes('zap')) return iconMap.power;
        if (str.includes('health') || str.includes('medical') || str.includes('doctor')) return iconMap.health;
        if (str.includes('emergency') || str.includes('relief') || str.includes('aid')) return iconMap.emergency;
        return iconMap.default;
    };

    return (
        <div className="relative group/browser flex items-center">
            {/* Left Arrow Button */}
            {showLeftArrow && (
                <div className="absolute left-0 top-0 bottom-0 z-20 flex items-center pr-10 bg-gradient-to-r from-background via-background/80 to-transparent pointer-events-none">
                    <button
                        onClick={() => handleScroll('left')}
                        className="h-8 w-8 rounded-full border border-border bg-card shadow-lg flex items-center justify-center text-foreground pointer-events-auto hover:bg-muted transition-all active:scale-90"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-6 sm:gap-10 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth w-full"
            >
                {allCategories.map((cat) => {
                    const Icon = resolveIcon(cat.name, cat.slug);
                    const isActive = selected === cat.slug;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelect(cat.slug)}
                            className={cn(
                                "group flex-shrink-0 flex flex-col items-center justify-center transition-all duration-300 relative",
                                "min-w-[48px] sm:min-w-[64px] outline-none",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center mb-2 transition-all duration-300",
                                "h-8 w-8 sm:h-10 sm:w-10 rounded-full",
                                isActive
                                    ? "bg-primary/10 scale-110 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    : "bg-transparent group-hover:scale-110"
                            )}>
                                <Icon className={cn(
                                    "transition-colors",
                                    "h-5 w-5 sm:h-6 sm:w-6",
                                    isActive ? "text-primary" : "group-hover:text-primary"
                                )} />
                            </div>

                            <span className={cn(
                                "tracking-tight text-center transition-all duration-300 whitespace-nowrap",
                                "text-[11.5px] sm:text-[12.5px]",
                                isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                            )}>
                                {cat.name}
                            </span>

                            {isActive && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Right Arrow Button */}
            {showRightArrow && (
                <div className="absolute right-0 top-0 bottom-0 z-20 flex items-center pl-10 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none">
                    <button
                        onClick={() => handleScroll('right')}
                        className="h-8 w-8 rounded-full border border-border bg-card shadow-lg flex items-center justify-center text-foreground pointer-events-auto hover:bg-muted transition-all active:scale-90"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}