export type InstagramMediaType = "IMAGE" | "VIDEO" | "REELS" | "CAROUSEL_ALBUM";

/** Normalized media item consumed by the UI — never the raw API shape. */
export type InstagramMedia = {
  id: string;
  /** Best available still image for this item (thumbnail for video/reels). */
  displayUrl: string;
  permalink: string;
  mediaType: InstagramMediaType;
  /** Sanitized, shortened caption excerpt. Never the full raw caption. */
  captionExcerpt: string | null;
  /**
   * Full caption, used only server-side to sort posts into collections.
   * Never rendered and never placed in an alt attribute.
   */
  rawCaption?: string;
  timestamp: string | null;
  /** Number of children, for carousels. */
  childCount?: number;
};

export type InstagramFeedResult =
  | { status: "ok"; media: InstagramMedia[]; source: "live" | "demo" }
  | { status: "empty" }
  | { status: "not-configured" }
  | { status: "error"; reason: InstagramErrorReason; message: string };

export type InstagramErrorReason =
  | "token-expired"
  | "rate-limited"
  | "network"
  | "unauthorized"
  | "unknown";
