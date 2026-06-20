import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
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
    <html lang="en" className={`${inter.variable} ${montserrat.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
