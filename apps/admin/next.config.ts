import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  basePath: '/admin',
  transpilePackages: ['@smartshop/ui', '@smartshop/types', '@smartshop/utils']
};

export default nextConfig;
