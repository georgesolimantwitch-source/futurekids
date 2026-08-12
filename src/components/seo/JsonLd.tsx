import { brand, listedApps } from "@/config/brand";

export function JsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.companyName,
    url: brand.siteUrl,
    description: brand.description,
    email: brand.supportEmail,
    logo: `${brand.siteUrl}${brand.logo.imagePath}`,
    sameAs: [brand.social.instagram, brand.social.tiktok],
  };

  const softwareApps = listedApps.map((app) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: app.name,
    applicationCategory: "LifestyleApplication",
    operatingSystem: app.playStoreUrl ? "iOS, Android" : "iOS",
    description: app.description,
    url: `${brand.siteUrl}${app.learnMorePath}`,
    image: `${brand.siteUrl}${app.iconPath}`,
    offers:
      app.availability === "live"
        ? {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          }
        : undefined,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      {softwareApps.map((data) => (
        <script
          key={data.name}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
}
