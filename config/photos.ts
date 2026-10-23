/**
 * Real-life photography only. Do not point these at AI/3D illustrations,
 * emoji tiles, or SVG placeholder screenshots.
 */
export const realPhotos = {
  kidsField: {
    src: "/images/home/hero-kids.jpg",
    alt: "Kids laughing together on a soccer field at sunset",
  },
} as const;

/** Per-app lifestyle photo — swap in real shoots when available. */
export const appLifePhotos = {
  fresher: realPhotos.kidsField,
  ballr: realPhotos.kidsField,
  scholars: realPhotos.kidsField,
  earnly: realPhotos.kidsField,
  tinypal: realPhotos.kidsField,
} as const;
