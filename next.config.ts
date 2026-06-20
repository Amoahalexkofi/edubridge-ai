import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage — user-uploaded avatars
      { protocol: "https", hostname: "*.supabase.co" },
      // Google OAuth profile photos (synced into profiles.avatar_url on sign-in)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
