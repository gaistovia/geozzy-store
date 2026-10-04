"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_INPUT_BYTES = 20 * 1024 * 1024;
const MAX_SIDE = 1600;

/** Shrinks a photo to at most 1600px and converts it to WebP (fast pages, small storage). */
export async function compressToWebp(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error(`"${file.name}" is not an image.`);
  if (file.size > MAX_INPUT_BYTES) throw new Error(`"${file.name}" is too large (maximum 20 MB).`);

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error(`"${file.name}" could not be read. Try a JPG or PNG photo.`);

  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser cannot process images.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error(`"${file.name}" could not be converted.`);
  return blob;
}

/** Compresses and uploads one image; returns its path inside the store-media bucket. */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await compressToWebp(file);
  const path = `${folder.replace(/\/+$/, "")}/${crypto.randomUUID()}.webp`;
  const { error } = await createClient()
    .storage.from("store-media")
    .upload(path, blob, { contentType: "image/webp", upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return path;
}
