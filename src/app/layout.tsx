import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { brand } from "@/config/brand";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#fbfbfe",
};

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: {
    default: `${brand.productName} — ${brand.tagline}`,
    template: `%s | ${brand.productName}`,
  },
  description: brand.description,
  applicationName: brand.productName,
  keywords: [
    brand.productName,
    brand.companyName,
    "Earnly",
    "Scholars Notes",
    "Ballr",
    "Freshys",
    "kids apps",
    "family apps",
    "parent controls",
  ],
  authors: [{ name: brand.companyName }],
  creator: brand.companyName,
  openGraph: {
    title: brand.productName,
    description: brand.description,
    url: brand.siteUrl,
    siteName: brand.productName,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brand.productName,
    description: brand.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    // Prefer media-matched PNGs. Avoid favicon.ico — it ignores color-scheme and
    // was forcing the wrong mark in Chrome.
    icon: [
      {
        url: "/icon-light-mode.png?v=genlyn-script",
        type: "image/png",
        sizes: "512x512",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-mode.png?v=genlyn-script",
        type: "image/png",
        sizes: "512x512",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/icon.png?v=genlyn-script", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png?v=genlyn-script",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} scroll-smooth overflow-x-hidden`}>
      <head>
        {/* Explicit scheme icons — file-based favicon.ico was forcing the wrong mark */}
        <link
          rel="icon"
          href="/icon-light-mode.png?v=genlyn-script"
          type="image/png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/icon-dark-mode.png?v=genlyn-script"
          type="image/png"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-background font-sans text-ink antialiased">
        <JsonLd />
        <Navigation />
        <main id="main-content" className="relative w-full max-w-[100vw] overflow-x-clip">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
