/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["canvas"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
