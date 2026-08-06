/**
 * Line icon set. All icons are decorative marks paired with real text labels,
 * so they carry `aria-hidden` and never act as the accessible name.
 */

type IconProps = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  "aria-hidden": true as const,
  focusable: "false" as const,
  className,
  style: { pointerEvents: "none" as const, flex: "0 0 auto" as const },
});

export function WhatsAppIcon({ size = 22, className, strokeWidth = 1.4 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth} />
      <path
        d="M8.6 9.1c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2 0 .4-.1.6l-.4.5c-.1.2-.2.3-.1.5.3.6 1.2 1.6 2.3 2.1.2.1.4.1.5-.1l.4-.5c.2-.2.3-.2.5-.1l1.5.8c.2.1.3.3.3.5v.5c0 .3-.2.6-.5.8-.5.3-1.1.4-1.7.2-1.1-.3-2.6-1-3.8-2.3-1-1.1-1.6-2.3-1.8-3.2-.1-.6 0-1.2.3-1.6l.2-.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InstagramIcon({ size = 22, className, strokeWidth = 1.4 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={strokeWidth} />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 18, className, strokeWidth = 1.4 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowCircleIcon({ size = 34, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <circle cx="12" cy="12" r="10.2" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <path
        d="M8.4 12h7.2m0 0-2.8-2.8M15.6 12l-2.8 2.8"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ExternalIcon({ size = 15, className, strokeWidth = 1.3 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M14 4h6v6M20 4l-8.5 8.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18 14.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChevronDownIcon({ size = 22, className, strokeWidth = 1.2 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M5 9.5 12 16l7-6.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 20, className, strokeWidth = 1.3 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M14.5 5 8 12l6.5 7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, className, strokeWidth = 1.3 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M9.5 5 16 12l-6.5 7"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Instagram media-type badge: Reel / video. */
export function ReelIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="3" y="4" width="18" height="16" rx="3.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.2 4.3 11 9M14 4.3 16.8 9M3.4 9h17.2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M10.6 12.2 14.4 14.4l-3.8 2.2v-4.4Z" fill="currentColor" />
    </svg>
  );
}

/** Instagram media-type badge: carousel album. */
export function CarouselIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <rect x="7.5" y="3.5" width="13" height="13" rx="2.6" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16.5 20.5H6a2.5 2.5 0 0 1-2.5-2.5V7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function UploadIcon({ size = 24, className, strokeWidth = 1.3 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloseIcon({ size = 20, className, strokeWidth = 1.3 }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function QuoteMarkIcon({ size = 40, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size * 0.72}
      viewBox="0 0 50 36"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ pointerEvents: "none", flex: "0 0 auto" }}
    >
      <path
        d="M0 36V20.5C0 9.2 6.2 1.6 18.4 0l1.6 5.6C13 7.4 9.4 11 9.4 16.2h8.2V36H0Zm30 0V20.5C30 9.2 36.2 1.6 48.4 0L50 5.6C43 7.4 39.4 11 39.4 16.2h8.2V36H30Z"
        fill="url(#vt-chrome)"
      />
    </svg>
  );
}
