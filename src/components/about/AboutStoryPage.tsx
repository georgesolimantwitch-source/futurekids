"use client";

import { CinematicHero } from "./CinematicHero";
import { WorldChangedSection } from "./WorldChangedSection";
import { ChallengeCardsSection } from "./ChallengeCardsSection";
import { EcosystemCircleSection } from "./EcosystemCircleSection";
import { ChildGrowthSection } from "./ChildGrowthSection";
import { ValuePillarsSection } from "./ValuePillarsSection";
import { VisionGlobeSection } from "./VisionGlobeSection";
import { FutureEcosystemSection } from "./FutureEcosystemSection";
import { AboutFinalCta } from "./AboutFinalCta";

export function AboutStoryPage() {
  return (
    <div className="overflow-x-hidden bg-white">
      <CinematicHero />
      <WorldChangedSection />
      <ChallengeCardsSection />
      <EcosystemCircleSection />
      <ChildGrowthSection />
      <ValuePillarsSection />
      <VisionGlobeSection />
      <FutureEcosystemSection />
      <AboutFinalCta />
    </div>
  );
}
