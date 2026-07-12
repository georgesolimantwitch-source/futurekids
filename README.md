# Future Brand — Marketing Website

Premium marketing site for the **Future Brand** children’s app ecosystem (Earnly, Scholars, Ballr, TinyPal).

Built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. Ready to deploy on Vercel. No database or authentication yet.

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve production build
npm run lint    # ESLint
```

---

## Change the company name

Edit **`config/brand.ts`**:

```ts
export const brand = {
  companyName: "Your Company",
  logo: {
    text: "Your Company", // used in nav + footer
    imagePath: "/images/brand/logo.svg",
  },
  // ...
};
```

Also update `siteUrl`, `supportEmail`, `tagline`, `description`, and social links in the same file. Changes propagate site-wide (titles, footer, JSON-LD, emails, etc.).

---

## Replace logos

1. Add your logo file under `public/images/brand/` (e.g. `logo.svg` or `logo.png`).
2. Update `brand.logo.imagePath` in `config/brand.ts`.
3. Replace favicon placeholders:
   - `public/icon.svg`
   - `public/apple-touch-icon.svg`
   - `src/app/icon.svg` (Next.js app icon)

The header currently uses **text** from `brand.logo.text`. You can wire an image logo into `Navigation` when ready.

---

## Replace screenshots

Placeholder SVGs live here:

```
public/images/apps/{earnly,scholars,ballr,tinypal}/
  icon.svg
  screenshot.svg
  screenshot-2.svg
  screenshot-3.svg
```

Update the paths in each app entry in `config/brand.ts`:

- `iconPath`
- `screenshotPath`
- `screenshots[].path`

Prefer WebP/PNG for real device shots. Keep filenames organized so you can swap assets without hunting through components.

---

## Update app links

All store and waitlist URLs live in **`config/brand.ts`** — do not hard-code them in pages.

| App | Fields |
|-----|--------|
| **Earnly** | `appStoreUrl` (+ `cta.href` should match) |
| **Scholars** | `appStoreUrl` (+ `cta.href` should match) |
| **Ballr** | `appStoreUrl` (iOS) and `playStoreUrl` (Android / future) |
| **TinyPal** | `availability: "waitlist"`, `cta.href` (e.g. `/contact?app=tinypal`). Leave `appStoreUrl` empty. |

Primary CTAs use `getAppCtaHref(app)`, which prefers `appStoreUrl` for live apps and the waitlist path for TinyPal.

---

## Update pricing (when ready)

Edit **`config/pricing.ts`**:

- `monthlyPrice` / `yearlyPrice` `display` and `amount` per app
- `discountPercent` on savings tiers
- FAQ answers and comparison table copy
- CTA destinations for subscriber sign-in

App names, colors, and icons sync from `config/brand.ts` automatically.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Framework preset: **Next.js** (detected automatically).
4. Set `brand.siteUrl` in `config/brand.ts` to your production domain before launch (used for sitemap, robots, Open Graph, and JSON-LD).

No environment variables are required for the static marketing site.

---

## Project structure

```
config/brand.ts                 # Single source of truth for brand + apps
src/app/                        # Routes (App Router)
src/components/
  layout/                       # Navigation, Footer
  home/                         # Homepage sections + AppShowcase
  apps/product/                 # Shared product page sections
  support/                      # Support form UI
  seo/                          # JSON-LD
public/images/                  # Logos + screenshot placeholders
```

### Key routes

- `/` — Homepage
- `/apps/earnly`, `/apps/scholars`, `/apps/ballr`, `/apps/tinypal`
- `/about`, `/safety`, `/support`, `/contact`
- `/pricing` — Plans & pricing (placeholder amounts)
- `/privacy`, `/terms` (draft placeholders — legal review required)
- `/sitemap.xml`, `/robots.txt`

---

## Notes

- **Legal pages** use careful placeholder language. Do not treat Safety, Privacy, or Terms as final compliance documents.
- **Support form** is UI-only; it does not submit to a backend.
- **TinyPal** never shows a fake App Store button — waitlist only.
