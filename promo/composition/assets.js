/**
 * Every picture the composition uses, all from the site itself: brand art and
 * backdrops from /public, captures of the running site (promo/captures, made by
 * scripts/capture-site.mjs) and the gallery exports the site already ships.
 */

const pad = (n) => String(n).padStart(2, "0");

export const PICKS = {
  // Grid order on the site matches public/gallery/feed 01–10. The phone's
  // grid shows 01–09 only, so the vertical cut pulls a different fifth post.
  feedPop: [1, 7, 3, 6, 10],
  feedPopV: [1, 7, 3, 6, 4],
  // Artwork only: the one photograph of Valentina in the film is the site's
  // own portrait (public/images/valentina/portrait.webp).
  creazioni: [1, 4, 6, 8, 9],
  flash: [1, 4, 5, 9],
  merch: [4, 3, 6, 1, 5, 11, 12, 7, 8],
};

export async function loadAssets(E) {
  const img = (url) => E.image(url);
  const A = {};
  const jobs = [];
  const put = (key, url) => jobs.push(img(url).then((t) => (A[key] = t)));

  put("wordmark", "/public/brand/wordmark-valentine-1400.webp");
  put("logo", "/public/brand/logo-valentine-288.webp");
  for (const b of ["hero", "about", "instagram", "booking"]) {
    put(`bd_${b}`, `/public/backdrops/${b}-desktop-2688.webp`);
    put(`bd_${b}_m`, `/public/backdrops/${b}-mobile-1080.webp`);
  }
  put("portrait", "/public/images/valentina/portrait.webp");

  for (const s of ["home", "instagram", "creazioni", "flash", "merch", "booking", "about"]) {
    put(`desk_${s}`, `/promo/captures/desktop-${s}.jpg`);
    put(`mob_${s}`, `/promo/captures/mobile-${s}.jpg`);
  }
  put("desk_journal", "/promo/captures/desktop-journal-article.jpg");

  A.feed = [];
  for (let i = 1; i <= 10; i++) jobs.push(img(`/public/gallery/feed/${pad(i)}-800.webp`).then((t) => (A.feed[i] = t)));
  A.creazioni = [];
  for (const i of PICKS.creazioni) jobs.push(img(`/public/gallery/creazioni/${pad(i)}-800.webp`).then((t) => (A.creazioni[i] = t)));
  A.flash = [];
  for (const i of PICKS.flash) jobs.push(img(`/public/gallery/flash/${pad(i)}-800.webp`).then((t) => (A.flash[i] = t)));
  A.merch = [];
  for (const i of PICKS.merch) jobs.push(img(`/public/gallery/merch/${pad(i)}-800.webp`).then((t) => (A.merch[i] = t)));

  await Promise.all(jobs);
  return A;
}
