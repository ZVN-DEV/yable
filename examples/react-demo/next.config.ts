import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@yable/core', '@yable/react', '@yable/themes'],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
