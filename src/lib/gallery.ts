import "server-only";

import manifest from "@/content/gallery-manifest.json";
import { instagramProfile, collections, type CollectionId } from "@/config/site-config";

import type { InstagramMedia } from "./instagram/types";

/**
 * Local media source.
 *
 * Instagram's official API has no story-highlights edge, and the highlight pages
 * return nothing without a login. The route that works is the one Instagram
 * itself provides: the account owner exports their media, and the site serves
 * it. `scripts/build-gallery.mjs` turns that export into optimized WebP and
 * writes `gallery-manifest.json`; this module reads it.
 *
 * This is real content — Valentina's own posts and highlights — not placeholder
 * artwork. It is a snapshot, so it does not update on its own: once
 * `INSTAGRAM_USER_ID` and `INSTAGRAM_ACCESS_TOKEN` are configured, the live feed
 * takes over for the Instagram section automatically and this becomes the
 * fallback.
 *
 * Each item links to the post or highlight it came from, so a Reel still plays
 * where it lives. The galleries show poster frames rather than autoplaying a
 * dozen videos, which the brief rules out and which no phone user would thank
 * us for.
 */

type ManifestItem = {
  id: string;
  /** Base path; the width suffix and extension are added per source. */
  src: string;
  width: number;
  height: number;
  mediaType: string;
  video?: string;
};

const sets = manifest as Record<string, ManifestItem[]>;

/** Widths emitted by the build script, in the order they go into `srcset`. */
const WIDTHS = [400, 800, 1200] as const;

function toMedia(item: ManifestItem, permalink: string): InstagramMedia {
  return {
    id: item.id,
    displayUrl: `${item.src}-800.webp`,
    srcSet: WIDTHS.map((w) => `${item.src}-${w}.webp ${w}w`).join(", "),
    permalink,
    mediaType: item.mediaType === "REELS" ? "REELS" : "IMAGE",
    captionExcerpt: null,
    timestamp: null,
  };
}

/** True when there is local media to show at all. */
export function hasLocalGallery(id: "feed" | CollectionId): boolean {
  return (sets[id]?.length ?? 0) > 0;
}

/**
 * The exported feed posts. Used when the live API is not configured.
 */
export function localFeed(): InstagramMedia[] {
  return (sets.feed ?? []).map((item) => toMedia(item, instagramProfile.url));
}

/**
 * One exported highlight. Items link to the highlight they belong to.
 */
export function localCollection(id: CollectionId): InstagramMedia[] {
  return (sets[id] ?? []).map((item) => toMedia(item, collections[id].highlightUrl));
}
