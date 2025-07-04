import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production build configuration
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  
  // Development rewrites (sadece dev modda çalışır)
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5001/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
