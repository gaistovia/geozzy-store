import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * GEOZZY STORE logo. The artwork has white and black parts, so these files are made for DARK
 * surfaces (black header, black footer, dark plate). Never place them straight on a white background.
 *
 *  wordmark  "GEOZZY STORE" lettering - header
 *  mark      G emblem with sneaker and watch - hero, placeholders
 *  full      everything together - footer
 */
const VARIANTS = {
  wordmark: { src: "/brand/logo-wordmark.png", width: 1049, height: 243 },
  mark: { src: "/brand/logo-mark.png", width: 661, height: 604 },
  full: { src: "/brand/logo-full-transparent.png", width: 1070, height: 1050 },
} as const;

export function Logo({
  variant = "wordmark",
  height = 34,
  className,
  plate = false,
  priority = false,
  alt = "GEOZZY STORE - Viatu na Saa Kali",
}: {
  variant?: keyof typeof VARIANTS;
  /** Display height in pixels. */
  height?: number;
  className?: string;
  /** Puts the logo on its own dark rounded plate, for use on light backgrounds (admin). */
  plate?: boolean;
  priority?: boolean;
  alt?: string;
}) {
  const v = VARIANTS[variant];
  const width = Math.round((height * v.width) / v.height);
  const image = (
    <Image
      src={v.src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      sizes={`${width}px`}
      className="shrink-0"
    />
  );
  if (!plate) return <span className={cn("inline-flex items-center", className)}>{image}</span>;
  return (
    <span className={cn("inline-flex items-center rounded-xl bg-[#0b0a05] px-3 py-2", className)}>{image}</span>
  );
}
