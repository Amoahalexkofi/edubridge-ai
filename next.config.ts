import type { NextConfig } from "next";

// Unique per build — baked into the client bundle AND readable server-side, so the
// app can tell when a newer version has been deployed and refresh itself.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now());

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },
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
