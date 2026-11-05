import type { NextConfig } from "next";
const internalApi = process.env.API_INTERNAL_URL || "http://127.0.0.1:4000";
const config: NextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${internalApi}/:path*` }];
  },
};
export default config;
