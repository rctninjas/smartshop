import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@smartshop/ui', '@smartshop/types', '@smartshop/utils']
};

export default nextConfig;
