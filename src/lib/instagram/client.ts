import "server-only";

import { z } from "zod";

import { instagramFeed } from "@/config/site-config";

import { demoMedia } from "./demo-data";
import type {
  InstagramErrorReason,
  InstagramFeedResult,
  InstagramMedia,
  InstagramMediaType,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/*                                                                            */
/* Instagram API with Instagram Login. Credentials are read from the server    */
/* environment only — never a NEXT_PUBLIC_ variable, never shipped to the      */
/* browser, never used to scrape HTML or call private endpoints.               */
/* -------------------------------------------------------------------------- */

const HOST = "https://graph.instagram.com";
const DEFAULT_API_VERSION = "v25.0";

const MEDIA_FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "thumbnail_url",
  "permalink",
  "timestamp",
  "children{id,media_type,media_url,thumbnail_url}",
].join(",");

function readConfig() {
  const userId = process.env.INSTAGRAM_USER_ID?.trim();
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.INSTAGRAM_API_VERSION?.trim() || DEFAULT_API_VERSION;
  const limit = clampLimit(process.env.INSTAGRAM_FEED_LIMIT);

  return { userId, accessToken, apiVersion, limit };
}

function clampLimit(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(parsed)) return instagramFeed.limit;
  return Math.min(Math.max(parsed, 1), 25);
}

/* -------------------------------------------------------------------------- */
/* API response schema                                                        */
/* -------------------------------------------------------------------------- */

const childSchema = z.object({
  id: z.string(),
  media_type: z.string().optional(),
  media_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
});

const mediaSchema = z.object({
  id: z.string(),
  caption: z.string().optional(),
  media_type: z.string().optional(),
  media_url: z.string().optional(),
  thumbnail_url: z.string().optional(),
  permalink: z.string().optional(),
  timestamp: z.string().optional(),
  children: z.object({ data: z.array(childSchema) }).optional(),
});

const responseSchema = z.object({
  data: z.array(mediaSchema),
});

const errorSchema = z.object({
  error: z.object({
    message: z.string().optional(),
    type: z.string().optional(),
    code: z.number().optional(),
    error_subcode: z.number().optional(),
  }),
});

/* -------------------------------------------------------------------------- */
/* Normalization                                                              */
/* -------------------------------------------------------------------------- */

const KNOWN_TYPES: InstagramMediaType[] = ["IMAGE", "VIDEO", "REELS", "CAROUSEL_ALBUM"];

function normalizeType(raw: string | undefined): InstagramMediaType {
  const upper = (raw ?? "").toUpperCase();
  return (KNOWN_TYPES as string[]).includes(upper) ? (upper as InstagramMediaType) : "IMAGE";
}

/**
 * Picks the still image to display.
 * - VIDEO / REELS prefer `thumbnail_url` so no video is downloaded for a preview.
 * - CAROUSEL_ALBUM falls back to its first child when the parent has no url.
 */
function pickDisplayUrl(item: z.infer<typeof mediaSchema>, type: InstagramMediaType): string | null {
  if (type === "VIDEO" || type === "REELS") {
    if (item.thumbnail_url) return item.thumbnail_url;
  }

  if (item.media_url) return item.media_url;

  const firstChild = item.children?.data?.[0];
  if (firstChild) {
    const childType = normalizeType(firstChild.media_type);
    if ((childType === "VIDEO" || childType === "REELS") && firstChild.thumbnail_url) {
      return firstChild.thumbnail_url;
    }
    if (firstChild.media_url) return firstChild.media_url;
    if (firstChild.thumbnail_url) return firstChild.thumbnail_url;
  }

  return item.thumbnail_url ?? null;
}

/**
 * Produces a short, safe alt/caption excerpt.
 * Long captions, hashtag walls and mentions are stripped — full captions must
 * never end up in an alt attribute.
 */
export function toCaptionExcerpt(caption: string | undefined, maxLength = 110): string | null {
  if (!caption) return null;

  const cleaned = caption
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#@][\w.À-ɏ]+/g, " ")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!cleaned) return null;
  if (cleaned.length <= maxLength) return cleaned;

  const cut = cleaned.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function normalize(items: z.infer<typeof responseSchema>["data"]): InstagramMedia[] {
  const result: InstagramMedia[] = [];

  for (const item of items) {
    const mediaType = normalizeType(item.media_type);
    const displayUrl = pickDisplayUrl(item, mediaType);

    // Items with no usable still and no permalink cannot be rendered or linked.
    if (!displayUrl || !item.permalink) continue;

    result.push({
      id: item.id,
      displayUrl,
      permalink: item.permalink,
      mediaType,
      captionExcerpt: toCaptionExcerpt(item.caption),
      rawCaption: item.caption,
      timestamp: item.timestamp ?? null,
      childCount: item.children?.data.length,
    });
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Error mapping                                                              */
/* -------------------------------------------------------------------------- */

function classifyError(status: number, body: unknown): { reason: InstagramErrorReason; message: string } {
  const parsed = errorSchema.safeParse(body);
  const apiMessage = parsed.success ? parsed.data.error.message : undefined;
  const code = parsed.success ? parsed.data.error.code : undefined;
  const subcode = parsed.success ? parsed.data.error.error_subcode : undefined;

  // 190 = invalid/expired token; subcode 463 = expired.
  if (status === 401 || code === 190 || subcode === 463) {
    return {
      reason: "token-expired",
      message:
        apiMessage ??
        "Instagram access token is invalid or expired. Refresh it (see README: token renewal).",
    };
  }

  // 4 / 17 / 32 / 613 are the throttling family.
  if (status === 429 || [4, 17, 32, 613].includes(code ?? -1)) {
    return { reason: "rate-limited", message: apiMessage ?? "Instagram rate limit reached." };
  }

  if (status === 403) {
    return {
      reason: "unauthorized",
      message: apiMessage ?? "The token lacks the instagram_business_basic permission.",
    };
  }

  return { reason: "unknown", message: apiMessage ?? `Instagram API responded with ${status}.` };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Fetches recent media for the connected Instagram professional account.
 *
 * Runs on the server only. Results are cached by the Next.js data cache for
 * `instagramFeed.revalidateSeconds`, so Instagram is not called on every render
 * and the short-lived CDN urls are refreshed on a regular cadence.
 */
export async function fetchInstagramFeed(): Promise<InstagramFeedResult> {
  const { userId, accessToken, apiVersion, limit } = readConfig();

  if (!userId || !accessToken) {
    // In development, sample data keeps the layout workable without credentials.
    // It is explicitly labelled as demo data and never used in production.
    if (process.env.NODE_ENV !== "production") {
      return { status: "ok", media: demoMedia.slice(0, limit), source: "demo" };
    }
    return { status: "not-configured" };
  }

  const url = new URL(`${HOST}/${apiVersion}/${userId}/media`);
  url.searchParams.set("fields", MEDIA_FIELDS);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: instagramFeed.revalidateSeconds, tags: ["instagram-feed"] },
    });

    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const { reason, message } = classifyError(response.status, body);
      logServerError(reason, message);
      return { status: "error", reason, message };
    }

    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) {
      logServerError("unknown", "Unexpected Instagram API response shape.");
      return {
        status: "error",
        reason: "unknown",
        message: "Unexpected Instagram API response shape.",
      };
    }

    const media = normalize(parsed.data.data).slice(0, limit);
    if (media.length === 0) return { status: "empty" };

    return { status: "ok", media, source: "live" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error.";
    logServerError("network", message);
    return { status: "error", reason: "network", message };
  }
}

function logServerError(reason: InstagramErrorReason, message: string) {
  // Server-side only. Never surfaces the token or the raw URL.
  console.error(`[instagram] ${reason}: ${message}`);
}
