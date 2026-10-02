import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Preserve the published article's links after changing its editorial focus.
  redirects() {
    return [{ source: "/journal/cyber-sigilism", destination: "/journal/cyber-tribal", permanent: true }];
  },

  images: {
    /**
     * Instagram serves media from short-lived CDN urls. Only Meta's image hosts
     * are allowed through the optimizer — no wildcard, no arbitrary remote host.
     */
    remotePatterns: [
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // Feed tiles are small; these widths cover the grid and carousel sizes.
    deviceSizes: [360, 430, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [96, 128, 160, 190, 256, 384],
    minimumCacheTTL: 3600,
  },
};

export default nextConfig;
