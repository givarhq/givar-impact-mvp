'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
    Compass,
    Droplets,
    Book,
    HeartPulse,
    Shield,
    ChevronLeft,
    ChevronRight,
    Sprout,
    Leaf,
    PawPrint,
    Cpu,
    Palette,
    Building
} from 'lucide-react';
import { cn } from '../../../lib/utils/cn';

const iconMap = {
    water: Droplets,
    education: Book,
    health: HeartPulse,
    agriculture: Sprout,
    emergency: Shield,
    climate: Leaf,
    animals: PawPrint,
    tech: Cpu,
    arts: Palette,
    community: Building,
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
        { id: 'all', name: 'All causes', slug: 'all' },
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
        if (str.includes('water')) return iconMap.water;
        if (str.includes('education')) return iconMap.education;
        if (str.includes('health')) return iconMap.health;
        if (str.includes('agriculture')) return iconMap.agriculture;
        if (str.includes('emergency')) return iconMap.emergency;
        if (str.includes('climate')) return iconMap.climate;
        if (str.includes('animal')) return iconMap.animals;
        if (str.includes('tech')) return iconMap.tech;
        if (str.includes('arts')) return iconMap.arts;
        if (str.includes('community')) return iconMap.community;
        return iconMap.default;
    };

    return (
        <div className="relative flex items-center w-full min-w-0 overflow-hidden">
            {showLeftArrow && (
                <div className="absolute left-0 top-0 bottom-0 z-10 hidden md:flex items-center pr-12 bg-gradient-to-r from-background via-background/90 to-transparent pointer-events-none">
                    <button
                        onClick={() => handleScroll('left')}
                        className="h-8 w-8 rounded-3xl border border-border/60 bg-card shadow-sm flex items-center justify-center text-muted-foreground pointer-events-auto hover:bg-muted hover:text-foreground transition-all active:scale-90"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-2 overflow-x-auto pb-1 px-1 no-scrollbar scroll-smooth w-full touch-pan-x min-w-0"
            >
                {allCategories.map((cat) => {
                    const Icon = resolveIcon(cat.name, cat.slug);
                    const isActive = selected === cat.slug;

                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelect(cat.slug)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-3xl border transition-all duration-200 whitespace-nowrap text-xs font-bold shrink-0 min-w-0",
                                isActive
                                    ? "bg-primary/5 text-primary border-primary/40 shadow-sm"
                                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span className="truncate">{cat.name}</span>
                        </button>
                    );
                })}
            </div>

            {showRightArrow && (
                <div className="absolute right-0 top-0 bottom-0 z-10 hidden md:flex items-center pl-12 bg-gradient-to-l from-background via-background/90 to-transparent pointer-events-none">
                    <button
                        onClick={() => handleScroll('right')}
                        className="h-8 w-8 rounded-3xl border border-border/60 bg-card shadow-sm flex items-center justify-center text-muted-foreground pointer-events-auto hover:bg-muted hover:text-foreground transition-all active:scale-90"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}