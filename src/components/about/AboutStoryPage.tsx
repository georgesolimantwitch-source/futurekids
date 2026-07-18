"use client";

import { CinematicHero } from "./CinematicHero";
import { MissionSection } from "./MissionSection";
import { ChallengeCardsSection } from "./ChallengeCardsSection";
import { EcosystemCircleSection } from "./EcosystemCircleSection";
import { ChildGrowthSection } from "./ChildGrowthSection";
import { ValuePillarsSection } from "./ValuePillarsSection";
import { VisionGlobeSection } from "./VisionGlobeSection";
import { AboutFinalCta } from "./AboutFinalCta";

export function AboutStoryPage() {
  return (
    <div className="overflow-x-hidden bg-white">
      <CinematicHero />
      <MissionSection />
      <ValuePillarsSection />
      <ChallengeCardsSection />
      <EcosystemCircleSection />
      <ChildGrowthSection />
      <VisionGlobeSection />
      <AboutFinalCta />
    </div>
  );
}
