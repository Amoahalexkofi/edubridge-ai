import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduBridge — BECE & WASSCE Prep",
    short_name: "EduBridge",
    description:
      "AI-powered BECE & WASSCE exam preparation for Ghana — lessons, practice questions, timed mock exams and a 24/7 AI tutor.",
    start_url: "/student",
    display: "standalone",
    background_color: "#F4F3EF",
    theme_color: "#1B3A8A",
    orientation: "portrait",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
