'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Scroll To Top Utility
 * Logic: Forces the browser to reset scroll position to (0,0) instantly
 * on every route change. This overrides the browser's attempt to
 * maintain scroll position from the previous page.
 */
export function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      // Logic: Use 'instant' behavior to ensure the user never sees a transition.
      // This happens immediately upon route resolution.
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });
    } catch (error) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [pathname, searchParams]);

  return null;
}