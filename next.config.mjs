/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // Older metadata and JSON-LD reference /og-image.png, which was never
      // added to public/. Serve the generated Open Graph image there instead.
      { source: "/og-image.png", destination: "/opengraph-image" },
    ];
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
