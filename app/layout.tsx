import type { Metadata, Viewport } from "next";
import "./globals.css";
import React from "react";

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://spek.systems"),
  title: "Spek — Technical Runbook, Architecture RFC & Data Workbench",
  description:
    "Industrial, offline-first Technical Runbook, Architecture RFC, and Data Report Workbench built for developers, sysadmins, IT staff, and digital business managers.",
  applicationName: "Spek",
  keywords: [
    "Runbook",
    "Architecture RFC",
    "Offline-First",
    "Data Grid",
    "Secret Scrubber",
    "KaTeX",
    "D3.js",
    "Technical Documentation",
  ],
  authors: [{ name: "Spek Systems" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.svg",
    apple: "/icon-192.svg",
  },
  openGraph: {
    title: "Spek — Industrial Technical Workbench",
    description:
      "Offline-first Runbook, Architecture RFC & Data Report Workbench for engineers and sysadmins.",
    url: "https://spek.systems",
    siteName: "Spek",
    type: "website",
    images: [
      {
        url: "/icon-512.svg",
        width: 512,
        height: 512,
        alt: "Spek Industrial Workbench",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spek — Industrial Technical Workbench",
    description:
      "Offline-first Runbook, Architecture RFC & Data Report Workbench for engineers and sysadmins.",
    images: ["/icon-512.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark bg-[#0a0a0a]">
      <head>
        {/* Priority Hints: Preload critical PWA icons and fonts with fetchPriority="high" */}
        <link
          rel="preload"
          href="/icon-192.svg"
          as="image"
          // @ts-expect-error React 18 / Next.js priority hint
          fetchpriority="high"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#0a0a0a] text-[#e5e5e5] antialiased selection:bg-[#3b82f6]/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
