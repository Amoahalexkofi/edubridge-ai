import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// One warm, humanist family across the whole product — headings and body.
// Reads as serious and trustworthy without the quirk of a display grotesque;
// its open, rounded letterforms feel soft rather than hard.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
