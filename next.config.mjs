/** @type {import('next').NextConfig} */
const nextConfig = {

  // Mantieni le tue configurazioni esistenti per le immagini se necessarie
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Permette immagini da qualsiasi dominio https
      },
    ],
  },

  // Fix per i moduli nativi (escpos, net, fs) su Vercel
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

export default nextConfig;