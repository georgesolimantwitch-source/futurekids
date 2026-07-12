import { multiAppSavingsSection, savingsTiers } from "@/config/pricing";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SavingsTierCard } from "./SavingsTierCard";

export function MultiAppSavingsSection() {
  return (
    <section className="bg-[#fafafa] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title={multiAppSavingsSection.headline}
          description={multiAppSavingsSection.supportingText}
          className="mb-10 sm:mb-14"
        />
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {savingsTiers.map((tier, index) => (
            <SavingsTierCard key={tier.id} tier={tier} highlighted={index === 2} />
          ))}
        </div>
      </div>
    </section>
  );
}
