import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    appDir: true,
  },
  output: "standalone",
  images: {
    domains: [],
  },
  env: {
    CUSTOM_KEY: "my-value",
  },
}

export default nextConfig
