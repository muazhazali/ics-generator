/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Netlify deployment optimization - ensure server-side features work
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'tesseract.js', 'pdfjs-dist'],
  },
  // Webpack configuration to handle large dependencies
  webpack: (config, { isServer }) => {
    // Handle node modules that need to be external
    if (isServer) {
      config.externals.push('pdf-parse', 'tesseract.js')
    }
    
    // Optimize for large files
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            maxSize: 244000, // 244KB chunks
          },
        },
      },
    }
    
    return config
  },
}

export default nextConfig
