/**
 * The film's format, from the page URL (?format=9x16). Everything is laid out
 * in this design space; the engine scales it to the output resolution.
 *
 *   16x9  1920×1080  the site on a desktop browser, a phone montage at the end
 *   9x16  1080×1920  the site on a phone, a desktop montage at the end
 */
const params = new URLSearchParams(location.search);
const id = params.get("format") === "9x16" ? "9x16" : "16x9";

export const F = id === "9x16"
  ? { id, W: 1080, H: 1920, vertical: true }
  : { id, W: 1920, H: 1080, vertical: false };
F.cx = F.W / 2;
F.cy = F.H / 2;
