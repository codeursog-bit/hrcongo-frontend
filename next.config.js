// ============================================================================
// 🚀 NEXT.JS CONFIG - AVEC PWA
// ============================================================================

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  
  runtimeCaching: [
    {
      urlPattern: /^\/(dashboard|presences|employes|conges|ma-paie)/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'pages-dashboard',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001'],
    },
  },
};

module.exports = withPWA(nextConfig);



// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   output: 'standalone',
//   reactStrictMode: true,
  
//   images: {
//     remotePatterns: [
//       {
//         protocol: 'https',
//         hostname: 'res.cloudinary.com',
//         pathname: '/**',
//       },
//     ],
//   },
  
//   // Support pour les route groups (public) et (dashboard)
//   experimental: {
//     serverActions: {
//       allowedOrigins: ['localhost:3000', 'localhost:3001'],
//     },
//   },
// };

// module.exports = nextConfig;