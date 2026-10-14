import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { ProductsPage } from "@/components/marketing/ProductsPage";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Freshys, Ballr, Scholars Notes, and Earnly — four apps that help kids eat better, move more, learn smarter, and earn responsibly.",
  alternates: { canonical: `${brand.siteUrl}/products` },
};

export default function Page() {
  return <ProductsPage />;
}
