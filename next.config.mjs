/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static file serving for uploads
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
  // Increase file upload limits
  experimental: {
    serverComponentsExternalPackages: ['mongodb'],
  },
}

export default nextConfig