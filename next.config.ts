import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  basePath: "/test2",
  assetPrefix: "/test2",
  output: "standalone"
};

export default nextConfig;
