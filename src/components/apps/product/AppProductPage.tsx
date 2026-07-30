import { type AppConfig } from "@/config/brand";
import { AppProductNav } from "./AppProductNav";
import { AppProductHero } from "./AppProductHero";
import { AppProductPricing } from "./AppProductPricing";
import { AppProductFeatures } from "./AppProductFeatures";
import { AppProductHowItWorks } from "./AppProductHowItWorks";
import { AppProductBenefits } from "./AppProductBenefits";
import { AppProductSafety } from "./AppProductSafety";
import { AppProductScreenshots } from "./AppProductScreenshots";
import { AppProductFaq } from "./AppProductFaq";
import { AppProductCta } from "./AppProductCta";

interface AppProductPageProps {
  app: AppConfig;
}

export function AppProductPage({ app }: AppProductPageProps) {
  // Marketing posters sell the app on their own, so they lead the page instead
  // of sitting below the written sections.
  const leadWithScreenshots = app.screenshotGalleryStyle === "marketing";

  return (
    <>
      <AppProductNav app={app} />
      <AppProductHero app={app} />
      {leadWithScreenshots && <AppProductScreenshots app={app} />}
      <AppProductPricing app={app} />
      <AppProductFeatures app={app} />
      <AppProductHowItWorks app={app} />
      <AppProductBenefits app={app} />
      <AppProductSafety app={app} />
      {!leadWithScreenshots && <AppProductScreenshots app={app} />}
      <AppProductFaq app={app} />
      <AppProductCta app={app} />
    </>
  );
}
