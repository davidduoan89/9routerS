/**
 * Next.js config for UI-only deployment (Vercel).
 *
 * API requests are proxied to the server via Next.js rewrites.
 * This avoids CORS issues — browser sees same-origin requests.
 *
 * Env vars:
 *   API_URL — Server URL for rewrites proxy (server-side only, recommended)
 *             e.g. https://9router.your-domain.com
 *
 *   NEXT_PUBLIC_API_URL — Same as API_URL but also exposed to client JS.
 *             Only needed if you want the browser to call the server directly
 *             (requires CORS + ALLOWED_ORIGINS on server).
 *
 * Recommended: Use API_URL only — rewrites handle everything, no CORS needed.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,
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
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    return [
      { source: "/api/:path*", destination: `${apiUrl}/api/:path*` },
      { source: "/v1/:path*", destination: `${apiUrl}/v1/:path*` },
    ];
  },
};

export default nextConfig;
