"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  url: string;
  alt: string;
}

/** Image gallery with thumbnails and hover-zoom on desktop. */
export function ProductGallery({
  images,
  name,
  labels,
}: {
  images: GalleryImage[];
  name: string;
  labels: { gallery: string; imageOf: string; zoomHint: string };
}) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[index];

  if (!current) {
    return (
      <div className="relative flex aspect-[4/5] items-center justify-center rounded-3xl bg-[#0b0a05]">
        <Image src="/brand/logo-mark.png" alt={name} width={661} height={604} className="w-1/2 opacity-60" />
      </div>
    );
  }

  return (
    <div role="group" aria-label={labels.gallery} className="space-y-3">
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted md:cursor-zoom-in"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const rect = e.currentTarget.getBoundingClientRect();
          setZoom({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
        }}
        onPointerLeave={() => setZoom(null)}
      >
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || name}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover transition-transform duration-200 ease-out"
          style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        />
      </div>

      {images.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={labels.imageOf.replace("{n}", String(i + 1)).replace("{total}", String(images.length))}
                aria-current={i === index ? "true" : undefined}
                className={cn(
                  "relative block size-16 overflow-hidden rounded-xl border-2 bg-muted sm:size-20",
                  i === index ? "border-gold-500" : "border-transparent opacity-75 hover:opacity-100",
                )}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
