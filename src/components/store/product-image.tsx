import Image from "next/image";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

/** Product photo with a branded placeholder when no image exists. Parent must be `relative`. */
export function ProductImage({
  path,
  alt,
  sizes,
  priority = false,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const src = mediaUrl(path);
  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("absolute inset-0 flex items-center justify-center bg-[#0b0a05]", className)}
      >
        <Image src="/brand/logo-mark.png" alt="" width={661} height={604} className="w-1/2 opacity-60" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
