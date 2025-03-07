import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ['pg'],
};

export default nextConfig;
