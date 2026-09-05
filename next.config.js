// ============================================================================
// 🚀 NEXT.JS CONFIG
// ============================================================================
// ✅ next-pwa RETIRÉ : il régénérait public/sw.js à chaque build (mode
// generateSW), écrasant le service worker custom nécessaire aux
// notifications push (rappels de pointage) et dépendant d'un chunk
// workbox-XXXX.js externe qui provoquait "Failed to update a ServiceWorker
// ... Not found" en cas de léger décalage de déploiement.
//
// public/sw.js est maintenant géré à la main (voir ce fichier) : il gère
// push + notificationclick + un cache basique pour l'offline. Comme il vit
// directement dans /public, Next.js le sert tel quel sans jamais le
// régénérer — plus aucun risque de désynchronisation au build.
// ============================================================================

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

module.exports = nextConfig;