import type { MetadataRoute } from "next";
import { apps, brand } from "@/config/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/about",
    "/pricing",
    "/safety",
    "/support",
    "/contact",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${brand.siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const appRoutes = apps.map((app) => ({
    url: `${brand.siteUrl}${app.learnMorePath}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...appRoutes];
}
