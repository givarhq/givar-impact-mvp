'use server';

import { revalidateTag } from 'next/cache';

/**
 * Executes a hard purge of the Next.js Data Cache across Edge nodes
 * forcing an instantaneous update for public visitors.
 */
export async function revalidateLegalDocsCache(slug: string) {
    revalidateTag('legal-docs');
    revalidateTag(`legal-doc-${slug}`);
}