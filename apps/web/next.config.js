/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    reactCompiler: true,
    transpilePackages: ["@givar/ui"],
    experimental: {
        serverActions: {
            bodySizeLimit: '2mb',
        },
    },
    images: {
        remotePatterns: [{
            protocol: 'https',
            hostname: '**',
        }, ],
    },
    logging: {
        fetches: {
            fullUrl: true,
        },
    },
};

module.exports = nextConfig;