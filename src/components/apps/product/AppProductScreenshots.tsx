import Image from "next/image";
import { type AppConfig } from "@/config/brand";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { AnimateOnScroll } from "@/components/ui/AnimateOnScroll";
import { AppScreenshotImage } from "@/components/ui/AppScreenshotImage";

interface AppProductScreenshotsProps {
  app: AppConfig;
}

const MARKETING_POSTER = { width: 576, height: 1024 };

export function AppProductScreenshots({ app }: AppProductScreenshotsProps) {
  const isMarketing = app.screenshotGalleryStyle === "marketing";

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimateOnScroll>
          <SectionHeading
            eyebrow="Screenshots"
            title="See it in action."
            description={`A closer look at the ${app.name} experience.`}
            className="mb-16"
          />
        </AnimateOnScroll>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {app.screenshots.map((screenshot, index) => (
            <AnimateOnScroll key={screenshot.path} delay={index * 100}>
              <figure className="group">
                {isMarketing ? (
                  <div className="overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-xl">
                    <Image
                      src={screenshot.path}
                      alt={screenshot.alt}
                      width={MARKETING_POSTER.width}
                      height={MARKETING_POSTER.height}
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="h-auto w-full"
                    />
                  </div>
                ) : (
                  <div
                    className="overflow-hidden rounded-2xl p-6 transition-all duration-300 group-hover:shadow-lg"
                    style={{ backgroundColor: app.accentColorLight }}
                  >
                    <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-[1.02]">
                      <AppScreenshotImage
                        app={app}
                        src={screenshot.path}
                        alt={screenshot.alt}
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                )}
                {screenshot.caption && (
                  <figcaption className="mt-4 text-center text-sm font-medium text-neutral-600">
                    {screenshot.caption}
                  </figcaption>
                )}
              </figure>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
