import Image from "next/image";
import Link from "next/link";
import { brand, apps } from "@/config/brand";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-neutral-500">
            {brand.companyName}
          </p>
          <h1 className="text-[2rem] font-semibold leading-[1.15] tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {brand.tagline}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-neutral-600 sm:mt-6 sm:text-xl">
            {brand.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4">
            <Button href="/#apps" size="lg" className="w-full sm:w-auto">
              Explore Our Apps
            </Button>
            <Button
              href="/#ecosystem"
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
            >
              Meet the Ecosystem
            </Button>
          </div>
        </div>

        <ul className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-3 sm:mt-16 sm:gap-4 lg:max-w-3xl lg:grid-cols-4">
          {apps.map((app) => (
            <li key={app.slug}>
              <Link
                href={app.learnMorePath}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 sm:h-14 sm:w-14"
                  style={{ backgroundColor: app.accentColorLight }}
                >
                  <Image
                    src={app.iconPath}
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-sm font-medium text-neutral-800">{app.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
