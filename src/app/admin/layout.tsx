import type { Metadata, Viewport } from "next";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/cormorant-garamond";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | GEOZZY Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

/** Root layout for the admin area (separate from the public, language-aware site). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
