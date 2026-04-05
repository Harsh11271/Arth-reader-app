/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["canvas"],
  turbopack: {},
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
