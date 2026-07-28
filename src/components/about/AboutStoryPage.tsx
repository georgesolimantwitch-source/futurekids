"use client";

import { CinematicHero } from "./CinematicHero";
import { MissionSection } from "./MissionSection";
import { ChallengeCardsSection } from "./ChallengeCardsSection";
import { EcosystemCircleSection } from "./EcosystemCircleSection";
import { AboutFinalCta } from "./AboutFinalCta";

export function AboutStoryPage() {
  return (
    <div className="overflow-x-hidden bg-white">
      <CinematicHero />
      <MissionSection />
      <ChallengeCardsSection />
      <EcosystemCircleSection />
      <AboutFinalCta />
    </div>
  );
}
