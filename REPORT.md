# Implementation report — Valentine Tattoo

Single-page site for Valentina Stucchi, rebuilt from the eight supplied reference
screenshots as real HTML/CSS/React. Next.js 16 (App Router), React 19, TypeScript,
CSS Modules, GSAP + ScrollTrigger, Motion, Zod.

---

## Phase 0 — skill installation

Installed through Claude Code's plugin marketplace (no fallback needed):

```
claude plugin marketplace add freshtechbro/claudedesignskills
claude plugin install modern-web-design@claude-design-skillstack
claude plugin install gsap-scrolltrigger@claude-design-skillstack
claude plugin install motion-framer@claude-design-skillstack
```

The marketplace README and `.claude-plugin/marketplace.json` were inspected first,
then each `SKILL.md` was read in full before any code was written. Marketplace name
as registered: **`claude-design-skillstack`**. No other bundles were installed and
no unrelated scripts were executed.

Guidance actually applied from the skills:

- **modern-web-design** — fluid `clamp()` type/space scales, token architecture,
  44px touch targets, `prefers-reduced-motion` handling, skeleton-over-spinner
  loading, "no scroll hijacking", `transform`/`opacity`-only animation.
- **gsap-scrolltrigger** — `useGSAP` with scoped cleanup, `gsap.matchMedia()` for
  breakpoint-conditional animation, `ScrollTrigger` `once`, `quickTo` for pointer
  parallax, killing/reverting on unmount, `ScrollTrigger.refresh()` after late
  content. Its "multiple tweens on the same element" pitfall directly shaped the
  one-library-per-element rule.
- **motion-framer** — `AnimatePresence` for the menu and uploader list,
  `useReducedMotion()`, variants with `staggerChildren`, spring interaction states,
  transform-only properties.

---

## What was built

Four content sections, in order, plus a persistent header. No Works, Flash, FAQ,
Studio, testimonials, services, blog, shop, prices or standalone footer.

Navigation is exactly `HOME · ABOUT · INSTAGRAM · BOOKING` → `#home #about
#instagram #booking`. Verified programmatically at every breakpoint.

| Area | Delivered |
| --- | --- |
| Design system | `globals.css` — tokens, chrome frame primitive, procedural atmosphere/grain, focus, reduced-motion |
| Chrome primitives | `ChromeFrame`, `ChromeButton`, `SectionHeading`, `PortraitFrame` |
| Ornaments | `SigilOrnament`, `CornerSigil`, `SigilBadge`, `SigilStar`, `SideGlyphRail`, `OrnamentDivider`, `OrnamentArc`, `LogoMark`, `SignatureMark` — all parametric SVG |
| Header | Sticky, active-section indicator via IntersectionObserver, scroll-driven opacity |
| Mobile menu | Motion overlay, `role="dialog"`, focus trap, Escape, scroll lock, focus restore |
| Hero | Asymmetric desktop / centred mobile, two CTAs, pointer parallax, scroll indicator |
| About | Portrait card, editorial copy, qualitative strip, Instagram CTA |
| Instagram | Server-side Graph API layer, desktop carousel + mobile grid, four states |
| Booking | Contact card, reassurance row, validated form with uploader, quote card |
| Animation | `ScrollAnimations` (GSAP only), Motion in components, strict separation |

---

## Instagram integration

Real integration against the **Instagram API with Instagram Login**
(`graph.instagram.com`), implemented server-side in `src/lib/instagram/client.ts`
(`import "server-only"`).

- `GET /{version}/{user-id}/media` with `id, caption, media_type, media_url,
  thumbnail_url, permalink, timestamp, children{…}`.
- Handles `IMAGE`, `VIDEO`, `REELS`, `CAROUSEL_ALBUM`. Video/Reels prefer
  `thumbnail_url`; carousels fall back to the first child. No video is downloaded
  to render a preview.
- Response validated with Zod, then normalized — the raw API shape never reaches
  the UI.
- Cached via the Next data cache (`revalidate: 3600`, tag `instagram-feed`), so
  Instagram is not called per render, expiring CDN urls refresh regularly and rate
  limits are respected.
- Errors classified: `token-expired` (190 / subcode 463), `rate-limited`
  (429 / 4 / 17 / 32 / 613), `unauthorized` (403), `network`, `unknown`.
- States: skeleton (exact card geometry, zero CLS), empty, not-configured, error.
  Each offers the real profile link.
- `alt` text is a sanitized, truncated caption excerpt — links, hashtags and
  mentions stripped, capped at 110 characters. Full captions never enter `alt`.
- Every tile links to its genuine `permalink`.

**Verified:** with deliberately invalid credentials the section rendered the honest
error state, the classification was correct (`token-expired`), the token appeared
nowhere in the served HTML, and no demo posts were substituted.

No scraping, no private endpoints, no browser-side token, no hard-coded token, and
**no engagement metrics anywhere** — the permission scope does not return them and
inventing them was not acceptable.

---

## Consultation form

- One Zod schema shared by client and server; the server re-validates everything.
- Fields: nome e cognome, email, telefono (optional), la tua idea, posizione,
  dimensione, riferimenti (optional), privacy consent checkbox.
- Uploads: drag-and-drop + click, type/size/count validation, selected-file list
  with individual remove, nothing uploaded until submit. Server re-checks count,
  size, declared MIME **and magic-number signature**, and sanitizes filenames.
- Spam protection: off-canvas honeypot, minimum time-to-submit, per-IP rate limit.
- Pluggable delivery adapter — webhook or transactional email, chosen by env vars.
  No provider is hard-coded.
- **With no provider configured the action refuses the submission and says so**,
  offering WhatsApp and Instagram instead. It never fabricates a success.

**Verified end to end** against a local webhook receiver: empty submit → 7 announced
field errors and 6 `aria-invalid` controls, no success; complete submit with an
attached PNG → payload delivered, genuine success state, announced politely.

---

## Content integrity

Everything the screenshots invented was removed or replaced:

| Removed | Replaced with |
| --- | --- |
| `3+ anni`, `500+ progetti`, `100% dedizione` | CUSTOM / PLACEMENT / TRIGGIANO qualitative blocks |
| `♥ 317  💬 12` on feed cards | nothing — no metrics are displayed |
| `666` decorative string | brand words on the rail |
| Illegible vertical pseudo-letters | non-semantic ornamental SVG glyphs, `aria-hidden` |
| `WORKS`, `FLASH` nav items | removed |
| `RISPOSTA RAPIDA / Entro poche ore` | `CONTATTO DIRETTO / Scegli il canale che preferisci` |
| AI-generated woman as the artist | declared neutral placeholder |
| Merged `Email / Telefono` field | separate Email and Telefono fields |
| Missing privacy consent | added, required |

Nothing was invented: no statistics, experience length, tattoo counts, awards,
opening hours, prices, address, response times, phone number, email, availability
or engagement values. The WhatsApp number is read from
`NEXT_PUBLIC_WHATSAPP_NUMBER`; with it unset the buttons simply do not render.

Confirmed on the production build: none of `317`, `3+`, `500+`, `100%`, `666`,
`WORKS`, `FLASH` appears in visible text (the raw-HTML matches are SVG path
coordinates and gradient stop offsets).

---

## Verification performed

**Build/quality** — `npm run lint` clean, `tsc --noEmit` clean, production build
succeeds, browser console clean at every viewport.

**Responsive**, rendered and measured at **360, 390, 430, 768, 1024, 1440, 1920**:

- no horizontal page scroll at any width;
- no element overflowing the viewport (carousel items inside their scroller
  excluded, correctly);
- every real interactive control ≥ 44 × 44 px (form fields 304×50, checkbox 44×44,
  buttons 46×46+, submit 304×64);
- no element left invisible after scrolling the page;
- every image has `alt`; every field has a label; exactly one `<h1>`.

**Reduced motion** — `js-motion` never applied, nothing hidden, no GSAP transforms
written, zero running animations, all content usable.

**No JavaScript** — H1 renders, nothing hidden, contact links and all form fields
present and usable.

**Mobile menu** — modal dialog, `aria-expanded` toggles, body scroll locked, focus
moves in, focus trapped across a full tab cycle, Escape closes, scroll restored,
focus returned to the trigger, exactly four anchors.

**Visual comparison** — seven screenshot rounds at 1440×815 and 390×844, each
compared against the paired reference. Refinements made across rounds: type scale,
section rhythm, hero column ratio, sigil sizing/bleed, carousel card count and
control placement, gallery panel width, About row rhythm and portrait ratio,
Booking mobile source order, signature legibility.

### Real bugs found and fixed during validation

1. **Reveal system matched nothing.** Selector strings inside a `useGSAP` scope
   resolve within that scope element, so `gsap.utils.toArray("[data-reveal]")`
   returned `[]` and the entire hero copy stayed at `opacity: 0`. Replaced with
   explicit document-level queries.
2. **Chrome frames and buttons showed the border colour across their whole area.**
   The hairline is painted as a full-size background layer behind a clipped inner
   layer; a translucent interior let it bleed through. Interiors made near-opaque.
3. **Hydration mismatches** — from the pre-paint class mutation (fixed with
   `suppressHydrationWarning`) and from GSAP styling the streamed Suspense subtree
   before React hydrated it (fixed by keeping reveal attributes off that subtree).
4. **Carousel controls clipped in half** by the frame's `clip-path`; the frame was
   moved inside the carousel so the controls sit outside it.
5. **Hero scroll indicator pushed off screen** — the portrait-orientation sigil was
   sized by width, making it 1031px tall. Bounded by height and the indicator
   anchored to the hero foot.
6. **Honeypot escaped the layout** — `clip` suppresses painting but not layout, so
   its box measured 158×33 past the viewport edge. Parked off-canvas.
7. **Consent checkbox was 22×22.** Now a 44×44 hit area with a 22px visual mark
   drawn as a background image.

---

## Deliberate differences from the screenshots

1. **Hero lettering.** The spiked chrome letterforms are an AI render with no
   licensed equivalent. The H1 uses Bodoni Moda with the chrome treatment
   (`background-clip: text` gradient + bloom + GSAP sweep) and stays a real,
   selectable, semantic `<h1>`. Drawing a full custom alphabet was out of scope;
   if the brand later commissions one, only the `.titleInk` rule changes.
2. **Text sizes are larger.** The references render body copy around 12–13px. Body
   is 16–18px and micro-labels no smaller than 10px, per the readability
   requirement. Everything downstream (section heights, line counts) follows from
   this — the About and Booking sections run slightly past one viewport at 815px
   where the references fit, because their text is unreadably small.
3. **About on mobile stacks below 700px.** The mobile reference keeps a two-column
   split; at 390px that yields ~168px text columns. Per the explicit instruction
   ("two-column editorial layout only while text remains readable"), the split is
   kept from 700px and stacks below it.
4. **Booking reassurance items stack below 480px** for the same reason; three
   across from 480px, matching the reference above that.
5. **Textures are procedural.** Grain is an inline SVG turbulence data URI and the
   marble clouding is layered radial gradients — no `grain.webp` / `marble-dark.webp`
   downloads. `public/textures/` exists but is intentionally empty.
6. **Fonts self-hosted** rather than requested from Google at runtime: no
   third-party connection on page load, and builds work offline.
7. **Mobile header** carries logo + sigil + hamburger (no BOOKING button), per the
   written spec; one reference screenshot showed a BOOKING button, another did not.
8. **Booking heading hierarchy** follows the written content spec — `BOOKING /
   CONSULENZA` as the eyebrow and `LA TUA IDEA, LA MIA VISIONE.` as the H2 — which
   matches the mobile reference exactly and reassigns the desktop screenshot's
   large "BOOKING / CONSULENZA" display line.
9. **Ornament fidelity.** The hero sigil and corner ornaments are hand-built
   parametric SVG in the same visual language, not tracings. They carry the
   cyber-tribal chrome character but are not pixel-identical to the AI renders.

---

## Placeholders and missing items

**Missing real photographs** (see `ASSETS.md`):

- `public/images/valentina/portrait.webp` — About portrait
- `public/images/valentina/portrait-mobile.webp` — optional mobile crop
- `public/images/valentina/portrait-quote.webp` — optional quote-card crop

Until supplied, the frames render a declared neutral placeholder ("Ritratto in
attesa della foto ufficiale") that preserves exact proportions, so dropping the real
file in causes no layout shift and needs no code change. **The AI-generated woman
from the screenshots was not used.**

**Missing credentials** — none are committed; all are documented in `.env.example`:

- `NEXT_PUBLIC_WHATSAPP_NUMBER` — real number required, never invented
- `INSTAGRAM_USER_ID`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_APP_SECRET`
- one of `CONSULTATION_WEBHOOK_URL` / `CONSULTATION_RECIPIENT_EMAIL`
  (+ `CONTACT_PROVIDER_API_KEY`)
- optional `UPLOAD_STORAGE_*`

**Known limitations**

- The form rate limit is in-memory and therefore per-instance. On multi-instance
  hosting, swap it for a shared store; noted in the README and in the code.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` is inlined at build time (standard Next.js
  behaviour), so changing the number requires a redeploy rather than a restart.
  Documented in both the README and `.env.example`. The server-side variables
  (Instagram, form delivery) are read at runtime and need no rebuild.

---

## Performance and accessibility decisions

- **No WebGL, no Three.js.** The chrome aesthetic is SVG + CSS gradients +
  transform/opacity animation. No measurable requirement justified a 3D bundle.
- **Ornaments are parametric SVG**, a few KB total, instead of large transparent
  rasters. Coordinates rounded to one decimal.
- **Fonts**: two variable latin subsets, 72 KB combined, self-hosted, `display:
  swap`, metric-matched fallbacks to limit swap shift.
- **Images**: `next/image` with AVIF/WebP, correct `sizes`, fixed aspect ratios
  (no CLS), lazy below the fold, first three feed tiles prioritised.
- **Remote hosts** restricted to Meta CDNs; no wildcard.
- **Animation budget honoured**: reveals 0.78s with 65ms stagger, ornament drift
  paused off-screen, chrome sweep a single pass (never looping), button
  interactions 180–280ms, feed zoom 1.03, parallax capped at ~11px displacement.
- **Native scrolling preserved** — no smooth-scroll library, no pinning, no
  scroll-jacking; the carousel controls only call `scrollBy`.
- **Progressive enhancement**: reveal start states live in CSS behind a class added
  by a tiny pre-paint script, with a 3s watchdog that removes it if the animation
  layer never reports ready. Content can never be permanently invisible.
- **One library per element** — GSAP owns scroll-driven work, Motion owns
  interaction/presence, CSS owns simple property transitions. No overlap.

---

## Acceptance criteria

| Criterion | Status |
| --- | --- |
| Exactly four content sections, correct order | ✅ verified in DOM |
| Both references represented faithfully | ✅ 7 comparison rounds |
| No Works / Flash / FAQ / Studio nav | ✅ verified |
| Real HTML/CSS, not screenshot backgrounds | ✅ |
| All text editable, none baked into images | ✅ single content module |
| Typography readable (≥16px body) | ✅ |
| Ornaments never block interaction | ✅ `pointer-events: none` throughout |
| Responsive 360px → large desktop | ✅ 7 widths measured |
| Mobile navigation accessible | ✅ 9 checks passed |
| Real `@valentine.ttt` feed integration | ✅ implemented, error path verified |
| Instagram credentials server-side only | ✅ token absent from served HTML |
| No scraping | ✅ official API only |
| No fake social metrics | ✅ none rendered |
| No AI woman presented as Valentina | ✅ declared placeholder |
| No fabricated statistics | ✅ verified against production HTML |
| WhatsApp uses a configurable real number | ✅ degrades gracefully when unset |
| Client + server validation | ✅ shared Zod schema |
| Submission never fakes success | ✅ verified both paths |
| Animations smooth and restrained | ✅ within the stated budget |
| Reduced motion respected | ✅ 4 checks passed |
| Lint, typecheck, production build pass | ✅ `npm run check` |
| Console free of errors | ✅ at all 7 widths |

---

## Note on repository layout

The eight reference screenshots were moved from the repository root into
`design-references/` (39 MB) so the application tree is clean. They are unchanged
and can be moved back at any time.
