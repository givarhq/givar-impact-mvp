'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
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

const iconMap: Record<string, React.ElementType> = {
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

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string;
}

interface CategoryBrowserProps {
    categories: Category[];
    selected: string;
    onSelect: (slug: string) => void;
}

export function CategoryBrowser({ categories, selected, onSelect }: CategoryBrowserProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);

    const allCategories: Category[] = [
        { id: 'all', name: 'All causes', slug: 'all' },
        ...categories
    ];

    const checkScroll = useCallback(() => {
        if (!scrollRef.current) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

        const overflow = scrollWidth > clientWidth + 4;
        setHasOverflow(overflow);

        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }, []);

    // Debounced resize listener
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const handleResize = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                checkScroll();
            }, 100);
        };

        checkScroll();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeout);
        };
    }, [categories, checkScroll]);

    // Auto-scroll active into view
    useEffect(() => {
        const active = scrollRef.current?.querySelector('[data-active="true"]');
        active?.scrollIntoView({
            behavior: 'smooth',
            inline: 'center',
            block: 'nearest'
        });
    }, [selected]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;

        const scrollAmount = scrollRef.current.clientWidth * 0.8;

        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    const resolveIcon = (cat: Category) => {
        if (cat.icon && iconMap[cat.icon]) {
            return iconMap[cat.icon];
        }

        const str = `${cat.name} ${cat.slug}`.toLowerCase();
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

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            const next = (index + 1) % allCategories.length;
            onSelect(allCategories[next].slug);
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            const prev = (index - 1 + allCategories.length) % allCategories.length;
            onSelect(allCategories[prev].slug);
        }

        if (e.key === 'Home') {
            e.preventDefault();
            onSelect(allCategories[0].slug);
        }

        if (e.key === 'End') {
            e.preventDefault();
            onSelect(allCategories[allCategories.length - 1].slug);
        }
    };

    return (
        <div className="relative flex items-center w-full min-w-0 overflow-hidden">
            {/* Left Gradient Cue */}
            {hasOverflow && (
                <div className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none bg-gradient-to-r from-background via-background/90 to-transparent w-10" />
            )}

            {/* Left Arrow */}
            {showLeftArrow && (
                <div className="absolute left-0 top-0 bottom-0 z-20 hidden md:flex items-center pl-1">
                    <button
                        onClick={() => handleScroll('left')}
                        aria-label="Scroll left"
                        className="h-8 w-8 rounded-3xl border border-border/60 bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                role="tablist"
                className="flex gap-2 overflow-x-auto pb-1 px-1 scroll-smooth w-full touch-pan-x min-w-0 no-scrollbar"
                style={{ scrollbarGutter: 'stable' }}
            >
                {allCategories.map((cat, index) => {
                    const Icon = resolveIcon(cat);
                    const isActive = selected === cat.slug;

                    return (
                        <button
                            key={cat.id}
                            role="tab"
                            aria-selected={isActive}
                            tabIndex={isActive ? 0 : -1}
                            data-active={isActive}
                            onClick={() => onSelect(cat.slug)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-3xl border transition-all duration-200 whitespace-nowrap text-xs font-bold shrink-0 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                                isActive
                                    ? "bg-primary/10 text-primary border-primary/50 shadow-sm scale-[1.02]"
                                    : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "h-3.5 w-3.5 shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                )}
                            />
                            <span className="truncate">{cat.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* Right Gradient Cue */}
            {hasOverflow && (
                <div className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none bg-gradient-to-l from-background via-background/90 to-transparent w-10" />
            )}

            {/* Right Arrow */}
            {showRightArrow && (
                <div className="absolute right-0 top-0 bottom-0 z-20 hidden md:flex items-center pr-1">
                    <button
                        onClick={() => handleScroll('right')}
                        aria-label="Scroll right"
                        className="h-8 w-8 rounded-3xl border border-border/60 bg-card shadow-sm flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
