/**
 * Next.js config for UI-only deployment (Vercel).
 * 
 * Serves only the dashboard — API requests are proxied to NEXT_PUBLIC_API_URL
 * via Vercel rewrites (see vercel.json), so no CORS issues.
 * 
 * Usage:
 *   1. Set NEXT_PUBLIC_API_URL env var in Vercel to your server URL
 *      e.g. https://9router.your-domain.com
 *   2. Deploy to Vercel — it auto-detects Next.js
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,
  // recharts is already lazy-loaded via React.lazy(); no modularizeImports needed.
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    config.watchOptions = {
      ...config.watchOptions,
      ignored: /[\\/](logs|\.next|gitbook|cli)[\\/]/,
    };
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    return [
      // Proxy /api/* to server (avoids CORS)
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
      // Proxy /v1/* LLM endpoints
      { source: "/v1/:path*", destination: `${apiUrl}/v1/:path*` },
    ];
  },
};

export default nextConfig;
