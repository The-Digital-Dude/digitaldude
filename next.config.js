const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: '/book',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/booking',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/schedule',
        destination: '/contact',
        permanent: true,
      },
      {
        source: '/solutions/logistics/erp-operations',
        destination: '/solutions/logistics/erp-hrm-systems',
        permanent: true,
      },
      {
        source: '/solutions/travel/marketplace-booking',
        destination: '/solutions/travel/marketplace-development',
        permanent: true,
      },
      {
        source: '/solutions/recruitment/candidate-portal',
        destination: '/solutions/recruitment/crm-development',
        permanent: true,
      },
      {
        source: '/solutions/home-services/dispatch-management',
        destination: '/solutions/home-services/marketplace-development',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(logo-full-color.png|logo-full-white.png|logo-mark.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
