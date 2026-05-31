/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for pdf-parse to work in Next.js API routes
  serverExternalPackages: ["pdf-parse"],
};

module.exports = nextConfig;
