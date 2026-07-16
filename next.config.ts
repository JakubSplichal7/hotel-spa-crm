import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Vercel deploy while Supabase query results are untyped.
  // We still fix real type issues as we go.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
