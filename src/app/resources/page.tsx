import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { resources } from "@/config/resources";
import { Reveal } from "@/components/site/motion";
import { Container, Eyebrow } from "@/components/site/ui";
import { ResourcesIndex } from "@/components/marketing/ResourcesIndex";
import { PageHero } from "@/components/marketing/shared";

const description = "Practical guides for parents on money, learning, sports, healthy food, and raising capable kids.";

export const metadata: Metadata = {
  title: "Resources",
  description,
  openGraph: {
    title: `Resources | ${brand.companyName}`,
    description,
    url: `${brand.siteUrl}/resources`,
    siteName: brand.companyName,
    type: "website",
  },
  alternates: { canonical: `${brand.siteUrl}/resources` },
};

export default function ResourcesPage() {
  return (
    <>
      <PageHero colors={["#fbcfe8", "#c4b5fd", "#bfdbfe", "#ffffff"]} intensity={0.7}>
        <Container className="pb-12 pt-14 text-center lg:pt-20">
          <Reveal>
            <Eyebrow color="#db2777" icon="book">
              Resources
            </Eyebrow>
          </Reveal>
          <Reveal delay={90} dir="blur">
            <h1 className="font-display mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
              Ideas for raising
              <br />
              <span className="gradient-text">capable kids.</span>
            </h1>
          </Reveal>
          <Reveal delay={180}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{description}</p>
          </Reveal>
        </Container>
      </PageHero>
      <Container className="pb-24 pt-6">
        <ResourcesIndex resources={resources} />
      </Container>
    </>
  );
}
