import type { Metadata } from "next";
import { Hanken_Grotesk, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Body/UI text — a warm, highly legible humanist grotesque (mobile-first).
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  display: "swap",
});

// Display/headings — a confident, distinctive grotesque used product-wide.
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduBridge AI — Smart Learning. Smarter Assessment.",
  description:
    "Ghana's AI-powered BECE & WASSCE preparation platform. Curriculum-aligned lessons, mock exams, and real-time analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${hanken.variable} ${bricolage.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
