import "server-only";

import { existsSync } from "node:fs";
import { join } from "node:path";

import crops from "@/content/backdrop-crop.json";
import manifest from "../../public/intro/intro-manifest.json";
import { INTRO_TIMING, type IntroConfig, type IntroCrop } from "./intro-timing";

export type { IntroConfig } from "./intro-timing";

/**
 * The opening video.
 *
 * Two files, dropped into `public/intro/`:
 *
 *   intro-desktop.mp4   landscape, matches the desktop hero plate
 *   intro-mobile.mp4    portrait, matches the mobile hero plate
 *
 * Both are optional. When neither exists the site simply opens on the hero, as
 * it does today — the intro is an enhancement, never a gate.
 *
 * The speed ramp is baked into the files by `scripts/build-intro.mjs`, so they
 * play at 1x. Their real lengths come from `intro-manifest.json`, written by
 * that same build.
 *
 * ## The crop
 *
 * The hero backdrop is not the whole source image: `build-backdrops.mjs` crops
 * each plate to the band between its own frame rules and publishes the
 * fractions it used. The video is filmed against the uncropped artwork and its
 * last frame is the hero image, so it has to receive the identical crop —
 * otherwise the handover would shift vertically at the exact moment it is meant
 * to be invisible. Those fractions are read here rather than retyped.
 */

const PUBLIC_DIR = join(process.cwd(), "public");

function fileIfPresent(path: string): string | null {
  return existsSync(join(PUBLIC_DIR, path.replace(/^\//, ""))) ? path : null;
}

/**
 * Returns the intro configuration, or `null` when there is no video to play.
 * Called on the server so the decision is baked into the HTML: the animation
 * layer then knows whether to wait, with no client-side race.
 */
export function resolveIntro(): IntroConfig | null {
  const desktop = fileIfPresent("/intro/intro-desktop.mp4");
  const mobile = fileIfPresent("/intro/intro-mobile.mp4");
  if (!desktop && !mobile) return null;

  const table = crops as Record<string, IntroCrop>;
  const built = manifest as Record<string, { duration: number }>;
  return {
    desktop,
    mobile,
    cropDesktop: table["hero-desktop"] ?? { top: 0, height: 1 },
    cropMobile: table["hero-mobile"] ?? { top: 0, height: 1 },
    // Measured by the build, not guessed: the baked ramp decides how long each
    // cut runs, and only the script that applied it knows to the frame.
    durationDesktop: built.desktop?.duration ?? INTRO_TIMING.duration,
    durationMobile: built.mobile?.duration ?? INTRO_TIMING.duration,
  };
}
