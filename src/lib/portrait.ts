import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Real photographs of Valentina have not been supplied. Rather than shipping an
 * AI-generated woman as if she were the artist, the portrait frames render a
 * clearly-labelled neutral placeholder until the approved files are dropped in.
 *
 * These checks run on the server at render time, so adding the file is the only
 * step required — no code change.
 */
const PUBLIC_DIR = join(process.cwd(), "public");

export const PORTRAIT_PATHS = {
  main: "/images/valentina/portrait.webp",
  mobile: "/images/valentina/portrait-mobile.webp",
} as const;

export type PortraitKey = keyof typeof PORTRAIT_PATHS;

export function hasPortrait(key: PortraitKey): boolean {
  return existsSync(join(PUBLIC_DIR, PORTRAIT_PATHS[key].replace(/^\//, "")));
}

/**
 * Resolves a portrait, falling back to the main portrait when a crop-specific
 * file has not been supplied.
 */
export function resolvePortrait(key: PortraitKey): string | null {
  if (hasPortrait(key)) return PORTRAIT_PATHS[key];
  if (key !== "main" && hasPortrait("main")) return PORTRAIT_PATHS.main;
  return null;
}
