const { withSentryConfig } = require("@sentry/nextjs");
const withPWA = require("@ducanh2912/next-pwa").default({
    dest: "public",
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    // Logic: Disable PWA service worker in development to prevent caching confusion
    disable: process.env.NODE_ENV === "development",
    workboxOptions: {
        disableDevLogs: true,
    },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // Logic: Enable React Compiler for optimized VDOM diffing (Next.js 15+)
    reactCompiler: true,
    transpilePackages: ["@givar/types", "@givar/database"],
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
        // Logic: Optimize package imports to speed up dev/build and reduce client bundle size
        optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion', 'date-fns'],
    },
    images: {
        // Logic: Strictly allow iDrive S3 endpoints for optimized image loading
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        formats: ['image/webp'],
    },
    // Logic: Proxy client-side API requests to the backend via Next.js rewrites to achieve Same-Site cookie compliance
    async rewrites() {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        return [
            {
                source: '/api/v1/:path*',
                destination: `${backendUrl}/v1/:path*`,
            },
        ];
    },
    // Logic: Aggressive minification and production source maps for forensic debugging
    productionBrowserSourceMaps: false,
    compress: true,
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
};

// Logic: Wrap config with PWA first, then Sentry, using unified v8+ configuration syntax
module.exports = withSentryConfig(
    withPWA(nextConfig),
    {
        org: "givar",
        project: "givar-web",

        // Only print logs for uploading source maps in CI
        silent: !process.env.CI,

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Transpiles SDK to be compatible with IE11 (increases bundle size)
        transpileClientSDK: true,

        // Hides source maps from generated client bundles
        hideSourceMaps: true,

        // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
        tunnelRoute: "/monitoring",

        webpack: {
            // Enables automatic instrumentation of Vercel Cron Monitors.
            automaticVercelMonitors: true,

            // Tree-shaking options for reducing bundle size
            treeshake: {
                removeDebugLogging: true,
            },
        },
    }
);