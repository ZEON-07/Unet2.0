import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "InkLife — How Many Pages Does Your Pen Have Left?",
  description:
    "Rate the visible ink in your pen and InkLife will estimate how many pages you have left. A playful stationery-tech tool for pen lovers.",
  keywords: ["ink estimator", "pen ink", "stationery", "pen life", "pages remaining"],
  openGraph: {
    title: "InkLife — How Many Pages Does Your Pen Have Left?",
    description: "Rate the visible ink. We'll estimate the rest.",
    type: "website",
    siteName: "InkLife",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative">
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
