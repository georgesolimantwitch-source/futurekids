import type { MetadataRoute } from "next";
import { brand, listedApps } from "@/config/brand";
import { resources } from "@/config/resources";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/products",
    "/genlyn-hub",
    "/creator",
    "/families",
    "/mission",
    "/about",
    "/pricing",
    "/resources",
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

  const appRoutes = listedApps.map((app) => ({
    url: `${brand.siteUrl}${app.learnMorePath}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const resourceRoutes = resources.map((resource) => ({
    url: `${brand.siteUrl}/resources/${resource.slug}`,
    lastModified: new Date(`${resource.publishedAt}T12:00:00Z`),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...appRoutes, ...resourceRoutes];
}
