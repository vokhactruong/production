import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },
  typedRoutes: true,
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
};

export default nextConfig;
