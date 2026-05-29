import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Givar',
        short_name: 'Givar',
        description: 'Transparent, verified, and impact-driven philanthropy protocol.',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#10b981', // Givar Primary Green
        orientation: 'portrait',
        icons: [
            {
                src: '/Givar1.png',
                sizes: 'any',
                type: 'image/png',
            },
            {
                src: '/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: '/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };
}