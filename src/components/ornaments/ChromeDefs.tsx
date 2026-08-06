/**
 * Shared SVG gradient/filter definitions for every chrome ornament.
 *
 * Rendered once, near the top of the document, inside a zero-size SVG. All
 * ornaments reference these ids so the metal treatment stays consistent and the
 * gradient stops are defined a single time.
 */
export function ChromeDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        {/* Primary chrome. Real polished metal spends most of its area DARK —
            bright bands are narrow. Keeping the dark stops wide is what stops
            the ornaments flattening into white silhouettes. */}
        <linearGradient id="vt-chrome" x1="0" y1="0" x2="0.25" y2="1">
          <stop offset="0%" stopColor="#20242a" />
          <stop offset="9%" stopColor="#e9edf1" />
          <stop offset="15%" stopColor="#7d848c" />
          <stop offset="30%" stopColor="#1c2025" />
          <stop offset="44%" stopColor="#c3c9d0" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="57%" stopColor="#5b6169" />
          <stop offset="72%" stopColor="#161a1e" />
          <stop offset="84%" stopColor="#aeb5bd" />
          <stop offset="92%" stopColor="#f2f5f8" />
          <stop offset="100%" stopColor="#2a2e34" />
        </linearGradient>

        {/* Angled variant so adjacent shapes do not read as one flat surface. */}
        <linearGradient id="vt-chrome-alt" x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#c8ced5" />
          <stop offset="14%" stopColor="#2a2f35" />
          <stop offset="34%" stopColor="#f4f7fa" />
          <stop offset="42%" stopColor="#787f87" />
          <stop offset="58%" stopColor="#191d21" />
          <stop offset="74%" stopColor="#dfe4e9" />
          <stop offset="86%" stopColor="#4a5057" />
          <stop offset="100%" stopColor="#22262b" />
        </linearGradient>

        {/* Soft edge chrome for large, low-contrast background ornaments. */}
        <linearGradient id="vt-chrome-soft" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#8f959c" stopOpacity="0.7" />
          <stop offset="30%" stopColor="#2c3137" stopOpacity="0.75" />
          <stop offset="58%" stopColor="#cdd3d9" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1e2226" stopOpacity="0.7" />
        </linearGradient>

        {/* Radial bloom placed behind bright nodes. */}
        <radialGradient id="vt-bloom" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Hairline stroke gradient for construction lines and rings. */}
        <linearGradient id="vt-hairline" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>

        {/* Controlled bloom — cheap single-pass blur, not an animated filter. */}
        <filter id="vt-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
