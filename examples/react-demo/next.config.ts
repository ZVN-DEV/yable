import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@zvndev/yable-core', '@zvndev/yable-react', '@zvndev/yable-themes'],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
