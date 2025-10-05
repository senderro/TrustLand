import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // <--- ignora ESLint durante a build
  },

};

export default nextConfig;
