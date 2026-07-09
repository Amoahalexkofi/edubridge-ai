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
  experimental: {
    // Avatar uploads go through a Server Action. The default body limit is 1MB,
    // but phone-camera photos are commonly 2-4MB (the client caps at 5MB), so
    // the action was silently failing and the spinner hung. Allow up to 6MB.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
