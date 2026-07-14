/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '20mb' }, // brochure uploads in Content Studio
  },
};

module.exports = nextConfig;
