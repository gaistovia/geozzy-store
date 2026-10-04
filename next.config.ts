import type { NextConfig } from "next";

/**
 * Product and brand images are served from Supabase Storage.
 * The hostname is derived from NEXT_PUBLIC_SUPABASE_URL so nothing is hardcoded.
 */
function supabaseImagePattern() {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      ...(u.port ? { port: u.port } : {}),
      pathname: "/storage/v1/object/public/**",
    };
  } catch {
    return { protocol: "https" as const, hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" };
  }
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [supabaseImagePattern()],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
