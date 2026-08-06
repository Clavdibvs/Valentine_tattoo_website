import { instagramProfile } from "@/config/site-config";

import type { InstagramMedia, InstagramMediaType } from "./types";

/**
 * ⚠️ DEVELOPMENT-ONLY SAMPLE DATA — NOT REAL INSTAGRAM CONTENT.
 *
 * Used exclusively when `NODE_ENV !== "production"` and no Instagram
 * credentials are configured, so the layout can be worked on without a token.
 * `fetchInstagramFeed` never returns this in production, the UI labels it as
 * demo content, and no engagement metrics are invented here — the API does not
 * supply them and the site does not display them.
 *
 * The images are neutral local vector placeholders, not photographs, so nothing
 * can be mistaken for real work by the artist.
 */

const TYPES: InstagramMediaType[] = [
  "IMAGE",
  "REELS",
  "CAROUSEL_ALBUM",
  "IMAGE",
  "VIDEO",
  "IMAGE",
  "CAROUSEL_ALBUM",
  "IMAGE",
  "REELS",
  "IMAGE",
  "CAROUSEL_ALBUM",
  "IMAGE",
];

export const demoMedia: InstagramMedia[] = TYPES.map((mediaType, index) => ({
  id: `demo-${index + 1}`,
  displayUrl: `/dev/demo-${String((index % 6) + 1).padStart(2, "0")}.svg`,
  permalink: instagramProfile.url,
  mediaType,
  captionExcerpt: "Contenuto di esempio per lo sviluppo locale",
  timestamp: null,
  childCount: mediaType === "CAROUSEL_ALBUM" ? 3 : undefined,
}));

/** Marks urls that come from the local demo set rather than Instagram's CDN. */
export function isDemoUrl(url: string): boolean {
  return url.startsWith("/dev/");
}
