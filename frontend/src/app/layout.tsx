import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EditorialFrame } from "@/components/layout/EditorialFrame";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { InkModeProvider } from "@/components/providers/InkModeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "മഷി ഉണ്ടോ മാഷേ ? (Mashi Undo Mashe?) — Laboratory Pen-Life & Writing Distance Estimator",
  description:
    "A playful, hyper-accurate stationery-tech application and interactive 3D pen visualizer that calculates exactly how many pages and meters of writing your pen has left based on its visible refill level.",
  keywords: ["മഷി ഉണ്ടോ മാഷേ", "mashi undo mashe", "ink estimator", "pen ink life", "stationery laboratory", "pen writing distance", "pages remaining"],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  openGraph: {
    title: "മഷി ഉണ്ടോ മാഷേ ? (Mashi Undo Mashe?) — Ink Estimation Lab",
    description: "Every drop has a distance. Visible ink detection & handwriting prediction.",
    type: "website",
    siteName: "മഷി ഉണ്ടോ മാഷേ ? (Mashi Undo Mashe?)",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "മഷി ഉണ്ടോ മാഷേ ? Logo",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative lab-grid selection:bg-[var(--ink-blue)] selection:text-white">
        <InkModeProvider>
          <QueryProvider>
            <EditorialFrame />
            <Navbar />
            <main className="flex-1 relative z-10">{children}</main>
            <Footer />
          </QueryProvider>
        </InkModeProvider>
      </body>
    </html>
  );
}
