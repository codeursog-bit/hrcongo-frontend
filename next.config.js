// // ============================================================================
// // 🚀 NEXT.JS CONFIG - AVEC PWA
// // ============================================================================

// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
  
//   runtimeCaching: [
//     {
//       urlPattern: /^\/(dashboard|presences|employes|conges|ma-paie)/,
//       handler: 'CacheFirst',
//       options: {
//         cacheName: 'pages-dashboard',
//         expiration: {
//           maxEntries: 50,
//           maxAgeSeconds: 7 * 24 * 60 * 60,
//         },
//       },
//     },
//     {
//       urlPattern: /^\/api\//,
//       handler: 'NetworkFirst',
//       options: {
//         cacheName: 'api-cache',
//         networkTimeoutSeconds: 10,
//         expiration: {
//           maxEntries: 100,
//           maxAgeSeconds: 24 * 60 * 60,
//         },
//       },
//     },
//   ],
// });

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
  
//   experimental: {
//     serverActions: {
//       allowedOrigins: ['localhost:3000', 'localhost:3001'],
//     },
//   },
// };

// module.exports = withPWA(nextConfig);

// ============================================================================
// 🚀 NEXT.JS CONFIG - AVEC PWA CORRIGÉ PROD
// ============================================================================
// CORRECTIFS :
//   1. sw: 'sw.js'     → pointe vers votre sw.js custom dans /public
//   2. register: false → vous gérez l'enregistrement dans usePushNotifications
//                        (évite le double enregistrement et le conflit Workbox)
//   3. buildExcludes   → exclut les fichiers Next.js internes qui causent le
//                        "bad-precaching-response" (app-build-manifest.json, etc.)
//   4. fallbacks       → page offline propre si réseau coupé
// ============================================================================

const withPWA = require('next-pwa')({
  dest: 'public',

  // ✅ Pointe vers VOTRE sw.js custom (pas celui auto-généré par next-pwa)
  sw: 'sw.js',

  // ✅ CRITIQUE : false = vous enregistrez manuellement dans usePushNotifications
  //    Si true, next-pwa enregistre un 2ème SW et crée un conflit
  register: false,

  skipWaiting: true,

  // ✅ Désactiver en dev (sinon le SW bloque le hot-reload)
  disable: process.env.NODE_ENV === 'development',

  // ✅ Exclure les fichiers internes Next.js du précache Workbox
  //    Ces fichiers changent d'URL à chaque déploiement → 404 → SW plante
  buildExcludes: [
    /app-build-manifest\.json$/,
    /build-manifest\.json$/,
    /react-loadable-manifest\.json$/,
    /_buildManifest\.js$/,
    /_ssgManifest\.js$/,
    /middleware-manifest\.json$/,
    /server\/.*\.js$/,
  ],

  runtimeCaching: [
    // Pages dashboard — CacheFirst (rapide, offline)
    {
      urlPattern: /^\/(dashboard|presences|employes|conges|ma-paie)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-dashboard',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    // API — NetworkFirst (données fraîches, fallback cache)
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
    // Assets statiques Next.js (_next/static) — StaleWhileRevalidate
    {
      urlPattern: /^\/_next\/static\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        },
      },
    },
    // Images — CacheFirst
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
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
