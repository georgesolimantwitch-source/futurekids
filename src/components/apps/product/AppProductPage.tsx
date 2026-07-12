import { type AppConfig } from "@/config/brand";
import { AppProductNav } from "./AppProductNav";
import { AppProductHero } from "./AppProductHero";
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
  return (
    <>
      <AppProductNav app={app} />
      <AppProductHero app={app} />
      <AppProductFeatures app={app} />
      <AppProductHowItWorks app={app} />
      <AppProductBenefits app={app} />
      <AppProductSafety app={app} />
      <AppProductScreenshots app={app} />
      <AppProductFaq app={app} />
      <AppProductCta app={app} />
    </>
  );
}
