import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export const CartIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 7h12l-1 12H7L6 7Z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </svg>
);
export const SearchIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </svg>
);
export const MenuIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const CloseIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);
export const SunIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </svg>
);
export const MoonIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);
export const PlusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const MinusIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);
export const TrashIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
  </svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const ArrowRightIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const WhatsAppIcon = (p: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" viewBox="0 0 32 32" {...p}>
    <path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.18 1.6 6L4 29l8.13-1.56a12.03 12.03 0 0 0 5.9 1.5h.01C24.68 28.94 30 23.54 30 16.9 30 10.3 24.66 3 16.04 3Zm0 22.9h-.01a10 10 0 0 1-5.1-1.4l-.37-.22-4.82.93.95-4.7-.24-.38a9.92 9.92 0 0 1-1.53-5.3C4.92 9.9 9.76 5.2 16.04 5.2c6.03 0 10.84 4.78 10.84 10.7 0 6-4.8 10-10.84 10Zm5.84-7.46c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.5-.16-.72.17-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.36-.5-2.6-1.6a9.8 9.8 0 0 1-1.8-2.23c-.19-.32 0-.5.14-.66.14-.14.32-.38.48-.57.16-.19.22-.32.33-.54.1-.22.05-.4-.03-.57-.08-.16-.72-1.74-.99-2.38-.26-.62-.52-.54-.72-.55h-.62c-.22 0-.57.08-.87.4-.3.32-1.14 1.12-1.14 2.72s1.17 3.16 1.33 3.38c.16.22 2.3 3.5 5.57 4.92.78.34 1.38.54 1.86.7.78.25 1.5.21 2.06.13.63-.1 1.9-.78 2.17-1.53.27-.75.27-1.4.19-1.53-.08-.14-.3-.22-.62-.38Z" />
  </svg>
);
