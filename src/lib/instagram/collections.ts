import "server-only";

import { collections, type CollectionId } from "@/config/site-config";

import { fetchInstagramFeed } from "./client";
import type { InstagramFeedResult, InstagramMedia } from "./types";

/**
 * Curated collections — "Creazioni", "Flash", "Merch".
 *
 * ## Why these are not story highlights
 *
 * The client asked for the content of three Instagram Story Highlights. The
 * official Instagram API **does not expose highlights**: the IG User node has
 * `media`, `stories` (only the last 24 hours), `tags` and `mentions`, and no
 * highlights edge. The third-party services that do offer them are scrapers,
 * which the brief rules out and which breach Instagram's terms.
 *
 * So the collections are built from the real feed instead, selected by a marker
 * in the caption. Valentina tags a post once and it appears in the right
 * section automatically — no code change, no second API call, no scraping.
 *
 * Two selection modes, in priority order:
 *
 * 1. **Explicit allowlist** — `INSTAGRAM_<ID>_MEDIA_IDS`, a comma-separated list
 *    of media ids. Full manual control when a collection needs curating by hand.
 * 2. **Caption markers** — `INSTAGRAM_<ID>_TAGS`, comma-separated hashtags or
 *    keywords. Defaults are in `site-config`.
 *
 * Every collection reads the same cached feed response, so all four Instagram
 * sections together still cost a single upstream request per revalidation
 * window.
 */

export type CollectionResult =
  | { status: "ok"; media: InstagramMedia[]; source: "live" | "demo" }
  | { status: "empty" }
  | { status: "not-configured" }
  | { status: "error"; reason: string; message: string };

function envList(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^#/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * A post belongs to a collection when its caption contains one of the markers
 * as a hashtag or as a standalone word.
 */
function matches(media: InstagramMedia, markers: string[]): boolean {
  const haystack = normalize(media.rawCaption ?? "");
  if (!haystack) return false;

  return markers.some((marker) => {
    const needle = normalize(marker);
    if (!needle) return false;
    // Word boundaries so "flash" does not match "flashback".
    return new RegExp(`(^|[^\\p{L}\\p{N}_])#?${escapeRegExp(needle)}([^\\p{L}\\p{N}_]|$)`, "u").test(
      haystack,
    );
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolves one collection from the shared feed.
 */
export async function fetchCollection(id: CollectionId): Promise<CollectionResult> {
  const config = collections[id];
  const feed: InstagramFeedResult = await fetchInstagramFeed();

  if (feed.status !== "ok") {
    if (feed.status === "empty") return { status: "empty" };
    if (feed.status === "not-configured") return { status: "not-configured" };
    return { status: "error", reason: feed.reason, message: feed.message };
  }

  const allowlist = envList(`INSTAGRAM_${config.envKey}_MEDIA_IDS`);
  if (allowlist.length > 0) {
    const byId = new Map(feed.media.map((item) => [item.id, item]));
    const picked = allowlist
      .map((mediaId) => byId.get(mediaId))
      .filter((item): item is InstagramMedia => Boolean(item));
    return picked.length > 0
      ? { status: "ok", media: picked.slice(0, config.limit), source: feed.source }
      : { status: "empty" };
  }

  const markers = envList(`INSTAGRAM_${config.envKey}_TAGS`);
  const active = markers.length > 0 ? markers : [...config.defaultTags];

  // Demo data carries no captions to match on, so in development every
  // collection shows a slice of the sample set rather than nothing at all.
  if (feed.source === "demo") {
    const offset = config.demoOffset % Math.max(feed.media.length, 1);
    const rotated = [...feed.media.slice(offset), ...feed.media.slice(0, offset)];
    return { status: "ok", media: rotated.slice(0, config.limit), source: "demo" };
  }

  const picked = feed.media.filter((item) => matches(item, active));
  if (picked.length === 0) return { status: "empty" };

  return { status: "ok", media: picked.slice(0, config.limit), source: "live" };
}
