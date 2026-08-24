import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import {
  siteMetadata,
  siteUrl,
  artist,
  googleTagManager,
  instagramProfile,
} from "@/config/site-config";

import "./globals.css";

/**
 * Fonts are self-hosted rather than requested from Google at runtime: no
 * third-party connection on page load (relevant for EU privacy), no build-time
 * network dependency, and one fewer origin to connect to. Both files are the
 * latin-subset variable versions.
 */

/** Editorial high-contrast serif — headings, wordmark, display type. */
const displayFont = localFont({
  src: [{ path: "../../public/fonts/bodoni-moda.woff2", style: "normal" }],
  weight: "400 700",
  display: "swap",
  variable: "--font-display",
  fallback: ["Didot", "Bodoni MT", "Times New Roman", "serif"],
  // Keeps the fallback close in metrics so swapping causes minimal shift.
  adjustFontFallback: "Times New Roman",
});

/** Neutral geometric sans — UI, labels, body copy. */
const sansFont = localFont({
  src: [{ path: "../../public/fonts/jost.woff2", style: "normal" }],
  weight: "300 600",
  display: "swap",
  variable: "--font-sans",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const metadata: Metadata = {
  /**
   * Resolves every relative URL Next emits — Open Graph images above all,
   * which social scrapers reject unless they are absolute.
   */
  metadataBase: new URL(siteUrl),
  title: siteMetadata.title,
  description: siteMetadata.description,
  applicationName: artist.brand,
  authors: [{ name: artist.name }],
  keywords: [
    "tatuaggi",
    "tattoo",
    "cyber tribal",
    "biomeccanico",
    "dark ornamental",
    "Triggiano",
    "Valenzano",
    "Bari",
    artist.studio,
    artist.brand,
  ],
  openGraph: {
    type: "website",
    locale: siteMetadata.locale,
    url: siteUrl,
    title: siteMetadata.title,
    description: siteMetadata.description,
    siteName: artist.brand,
  },
  twitter: {
    card: "summary_large_image",
    title: siteMetadata.title,
    description: siteMetadata.description,
  },
  /**
   * The page is reachable with query strings appended by ad and social
   * referrers (`?fbclid=`, `?utm_source=`), and each of those is a distinct URL
   * to a crawler. The canonical says they are all the same page.
   */
  alternates: {
    canonical: "/",
  },
  other: {
    "instagram:creator": instagramProfile.handleWithAt,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // 200% zoom must remain possible.
  maximumScale: 5,
};

/**
 * Runs before first paint. Marks the document as motion-capable so reveal
 * targets can be staged in CSS without a flash of visible-then-hidden content.
 *
 * Two safety valves keep content from ever getting stuck invisible:
 *  - the class is not added at all when reduced motion is requested;
 *  - a watchdog removes it if the animation layer never reports itself ready
 *    (script blocked, chunk failed, hydration error).
 */
/**
 * Google Tag Manager, verbatim from the container's own install instructions.
 *
 * It is written inline in `<head>` rather than through `next/script` or
 * `@next/third-parties` because Google's instruction is to place it as early
 * as possible, and both of those defer it until after hydration. The snippet
 * itself blocks nothing: it pushes one event onto `dataLayer` and appends an
 * `async` script tag, so the parser walks straight past it.
 *
 * Left exactly as Google generated it — including the minified formatting —
 * so it can be diffed against the console when the container is reinstalled.
 */
const GTM_BOOTSTRAP = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${googleTagManager.id}');`;

/**
 * The `<noscript>` half of the same install: a tracking iframe for visitors
 * with JavaScript disabled. Set through `dangerouslySetInnerHTML` because
 * React would otherwise escape the markup inside `<noscript>` into text.
 */
const GTM_NOSCRIPT = `<iframe src="https://www.googletagmanager.com/ns.html?id=${googleTagManager.id}"
height="0" width="0" style="display:none;visibility:hidden"></iframe>`;

const MOTION_BOOTSTRAP = `
(function () {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var root = document.documentElement;
    root.classList.add('js-motion');
    setTimeout(function () {
      if (!root.hasAttribute('data-motion-ready')) root.classList.remove('js-motion');
    }, 3000);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={siteMetadata.lang}
      className={`${displayFont.variable} ${sansFont.variable}`}
      /* The pre-paint bootstrap below mutates this element's class and
         attributes before React hydrates — expected, not a real mismatch. */
      suppressHydrationWarning
    >
      <head>
        {/* Google Tag Manager — first in head, as the container's install asks. */}
        {googleTagManager.enabled ? (
          <script dangerouslySetInnerHTML={{ __html: GTM_BOOTSTRAP }} />
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: MOTION_BOOTSTRAP }} />
      </head>
      <body>
        {/* Google Tag Manager (noscript) — immediately after the opening body. */}
        {googleTagManager.enabled ? (
          <noscript dangerouslySetInnerHTML={{ __html: GTM_NOSCRIPT }} />
        ) : null}
        {children}
      </body>
    </html>
  );
}
