import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { brand } from "@/config/brand";
import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(brand.siteUrl),
  title: {
    default: `${brand.companyName} — Apps for the Next Generation`,
    template: `%s | ${brand.companyName}`,
  },
  description: brand.description,
  applicationName: brand.companyName,
  keywords: [
    brand.companyName,
    "Earnly",
    "Scholars Notes",
    "Ballr",
    "TinyPal",
    "kids apps",
    "family apps",
    "parent controls",
  ],
  authors: [{ name: brand.companyName }],
  creator: brand.companyName,
  openGraph: {
    title: brand.companyName,
    description: brand.description,
    url: brand.siteUrl,
    siteName: brand.companyName,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: brand.companyName,
    description: brand.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className="min-h-screen overflow-x-hidden bg-[#fafafa] font-sans text-neutral-900 antialiased">
        <JsonLd />
        <Navigation />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
