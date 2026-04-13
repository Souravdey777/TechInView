/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "builders.to",
      },
    ],
  },
  webpack: (config, { dev }) => {
    // Dev: avoid ChunkLoadError when the first compile of a chunk is slow (e.g. busy event loop).
    if (dev) {
      config.output = { ...config.output, chunkLoadTimeout: 180000 };
    }
    return config;
  },
};

export default nextConfig;
