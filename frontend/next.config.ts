import type { NextConfig } from 'next';

// BACKEND_URL pour le proxy serveur (Docker: http://backend:3001, local: http://localhost:3001)
const apiUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
