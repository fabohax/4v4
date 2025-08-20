import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ipfs.io' },
      { protocol: 'https', hostname: 'scarlet-charming-caterpillar-527.mypinata.cloud' },
      { protocol: 'https', hostname: 'gateway.pinata.cloud' },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '350mb',
    },
  },
};

export default nextConfig;
