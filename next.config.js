/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for pdf-parse to work in Next.js API routes
  serverExternalPackages: ["pdf-parse"],

  // Disable React strict mode to prevent double-mount side effects in dev
  reactStrictMode: false,
};

module.exports = nextConfig;
