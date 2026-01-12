/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@givar/ui"],
    experimental: {
        reactCompiler: true, //Automatic memoization (No more useMemo/useCallback)
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: '**', // Allow external avatars/project images
        }, ],
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
};

module.exports = nextConfig;