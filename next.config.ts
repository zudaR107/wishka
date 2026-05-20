import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  output: "standalone",
  experimental: {
    // Raise body size limit so the image upload API route can receive up to 8 MB.
    serverActions: {
      bodySizeLimit: "9mb",
    },
  },
};

export default nextConfig;
