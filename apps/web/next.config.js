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
    transpilePackages: ["@givar/ui"],
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
    // Logic: Aggressive minification and production source maps for forensic debugging
    productionBrowserSourceMaps: false,
    compress: true,
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
};

// Logic: Wrap config with PWA first, then Sentry, ensuring both handlers are active
module.exports = withSentryConfig(
    withPWA(nextConfig),
    {
        silent: true,
        org: "givar",
        project: "givar-web",
    },
    {
        widenClientFileUpload: true,
        transpileClientSDK: true,
        hideSourceMaps: true,
        disableLogger: true,
        automaticVercelMonitors: true,
        // Logic: Tunneling bypasses ad-blockers that often block Sentry ingest on the frontend
        tunnelRoute: "/monitoring-tunnel",
    }
);