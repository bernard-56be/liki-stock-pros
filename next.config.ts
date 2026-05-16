/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pzyqxowfhluspperotap.supabase.co', // Le domaine Supabase exact
        port: '',
        pathname: '/storage/v1/object/public/**', // Autoriser tout ce qui vient du bucket public
      },
    ],
  },
};

export default nextConfig; // ou module.exports = nextConfig; si c'est en CommonJS