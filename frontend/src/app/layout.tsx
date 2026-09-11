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
  title: "InkLife® — Laboratory Pen-Life & Writing Distance Estimator",
  description:
    "Experimental laboratory interface for estimating remaining handwriting distance and notebook page capacity from visible pen ink.",
  keywords: ["ink estimator", "pen ink life", "stationery laboratory", "pen writing distance", "pages remaining"],
  openGraph: {
    title: "InkLife® — Ink Estimation Lab",
    description: "Every drop has a distance. Visible ink detection & handwriting prediction.",
    type: "website",
    siteName: "InkLife",
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
