'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import Image from 'next/image';

export interface LightboxItem {
    url: string;
    type?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    alt?: string;
}

interface ImageLightboxProps {
    isOpen: boolean;
    onClose: () => void;
    items: LightboxItem[];
    initialIndex?: number;
}

export function ImageLightbox({ isOpen, onClose, items, initialIndex = 0 }: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
    const [direction, setDirection] = React.useState(0);

    useEffect(() => {
        if (isOpen) setCurrentIndex(initialIndex);
    }, [isOpen, initialIndex]);

    const paginate = useCallback((newDirection: number) => {
        if (items.length <= 1) return;
        setDirection(newDirection);
        setCurrentIndex((prev) => (prev + newDirection + items.length) % items.length);
    }, [items.length]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isOpen) return;
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowRight') paginate(1);
        if (e.key === 'ArrowLeft') paginate(-1);
    }, [isOpen, onClose, paginate]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen || items.length === 0) return null;

    const handleDragEnd = (e: any, { offset }: PanInfo) => {
        const swipe = offset.x;
        if (swipe < -50) {
            paginate(1);
        } else if (swipe > 50) {
            paginate(-1);
        }
    };

    const currentItem = items[currentIndex];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md">
            {/* Header controls */}
            <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-50 pointer-events-none">
                <div className="text-white font-bold text-sm bg-white/10 px-5 py-2.5 rounded-3xl backdrop-blur-md shadow-sm pointer-events-auto">
                    {currentIndex + 1} / {items.length}
                </div>
                <button
                    onClick={onClose}
                    className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors pointer-events-auto active:scale-95"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Main content */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none">
                <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        initial={{ opacity: 0, x: direction > 0 ? 300 : -300, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: direction < 0 ? 300 : -300, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={handleDragEnd}
                        className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-12 cursor-grab active:cursor-grabbing"
                    >
                        {currentItem.type === 'VIDEO' ? (
                            <video
                                src={currentItem.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-full rounded-3xl shadow-2xl border border-white/10"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : currentItem.type === 'DOCUMENT' ? (
                            <div className="flex flex-col items-center gap-5 text-white">
                                <div className="h-24 w-24 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20">
                                    <FileText className="h-10 w-10 opacity-70" />
                                </div>
                                <a
                                    href={currentItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white text-black px-8 py-3.5 rounded-3xl font-bold text-sm hover:bg-gray-200 transition-colors active:scale-95"
                                >
                                    Open document
                                </a>
                            </div>
                        ) : (
                            <div className="relative w-full h-full max-w-5xl max-h-[85vh]">
                                <Image
                                    src={currentItem.url}
                                    alt={currentItem.alt || `Gallery image ${currentIndex + 1}`}
                                    fill
                                    className="object-contain drop-shadow-2xl select-none"
                                    draggable={false}
                                    unoptimized
                                />
                            </div>
                        )}

                        {currentItem.alt && currentItem.type === 'IMAGE' && (
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-3xl text-sm font-medium max-w-md text-center pointer-events-none">
                                {currentItem.alt}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); paginate(-1); }}
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 hidden md:flex items-center justify-center text-white transition-all z-50 backdrop-blur-md active:scale-90"
                    >
                        <ChevronLeft className="h-6 w-6 pr-0.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); paginate(1); }}
                        className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 hidden md:flex items-center justify-center text-white transition-all z-50 backdrop-blur-md active:scale-90"
                    >
                        <ChevronRight className="h-6 w-6 pl-0.5" />
                    </button>
                </>
            )}
        </div>
    );
}