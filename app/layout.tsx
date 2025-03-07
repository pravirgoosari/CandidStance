import type React from "react";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "CandidStance - Discover Political Stances",
  description:
    "Discover candidates' positions on key issues with AI-driven analysis and credible sources",
  metadataBase: new URL('https://candidstance.ai'),
  openGraph: {
    title: "CandidStance - Discover Political Stances",
    description: "Discover candidates' positions on key issues with AI-driven analysis and credible sources",
    url: "https://candidstance.ai",
    siteName: "CandidStance",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CandidStance - Discover Political Stances",
    description: "Discover candidates' positions on key issues with AI-driven analysis and credible sources",
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'apple-touch-icon', url: '/apple-touch-icon.png' },
      { rel: 'mask-icon', url: '/favicon.svg', color: '#2864EC' }
    ]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://candidstance.ai",
  },
  authors: [{ name: "Pravir Goosari" }],
  keywords: ["politics", "candidates", "political stances", "policy positions", "elections", "voting"],
  category: "politics",
  classification: "politics",
  referrer: "origin-when-cross-origin",
  creator: "Pravir Goosari",
  publisher: "Pravir Goosari",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  applicationName: "CandidStance",
  generator: "Next.js",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black",
    "apple-mobile-web-app-title": "CandidStance",
    "format-detection": "telephone=no",
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#2864EC",
    "msapplication-tap-highlight": "no",
    "theme-color": "#2864EC",
  },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2864EC", colorScheme: "light" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.className}>{children}</body>
    </html>
  );
}
