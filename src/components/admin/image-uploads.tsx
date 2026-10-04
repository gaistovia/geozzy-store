"use client";

import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/input";
import { uploadImage } from "@/lib/admin/upload-client";
import { mediaUrl } from "@/lib/media";

/** Uploads several product photos, records each one, then refreshes the page. */
export function ProductImageUploader({
  productId,
  record,
}: {
  productId: string;
  /** Server action that saves the uploaded file against the product. */
  record: (productId: string, path: string) => Promise<{ error?: string } | void>;
}) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setErrors([]);
    const problems: string[] = [];
    let done = 0;
    for (const file of Array.from(files)) {
      setStatus(`Uploading ${done + 1} of ${files.length}...`);
      try {
        const path = await uploadImage(file, `products/${productId}`);
        const res = await record(productId, path);
        if (res && res.error) problems.push(`${file.name}: ${res.error}`);
      } catch (e) {
        problems.push(e instanceof Error ? e.message : `${file.name}: upload failed`);
      }
      done++;
    }
    setBusy(false);
    setStatus(problems.length < files.length ? `${files.length - problems.length} photo(s) uploaded.` : "");
    setErrors(problems);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        disabled={busy}
        onChange={(e) => onFiles(e.target.files)}
      />
      <Button type="button" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? "Uploading..." : "Upload photos"}
      </Button>
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP. Photos are resized and compressed automatically. You can pick many at once.
      </p>
      <p role="status" aria-live="polite" className="text-sm text-success">
        {status}
      </p>
      {errors.map((e) => (
        <FormMessage key={e}>{e}</FormMessage>
      ))}
    </div>
  );
}

/** One image for a form (category, promotion banner, homepage hero). Saves its path in a hidden field. */
export function SingleImageField({
  name,
  folder,
  initialPath,
  label,
  hint,
}: {
  name: string;
  folder: string;
  initialPath: string | null;
  label: string;
  hint?: string;
}) {
  const [path, setPath] = useState<string>(initialPath ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = mediaUrl(path);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      setPath(await uploadImage(file, folder));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <input type="hidden" name={name} value={path} />
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-24 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-xs text-muted-foreground">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            "No image"
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            aria-label={label}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => inputRef.current?.click()}>
              {busy ? "Uploading..." : path ? "Replace" : "Upload"}
            </Button>
            {path && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setPath("")}>
                Remove
              </Button>
            )}
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          <p className="text-xs text-muted-foreground">Remember to press Save for the change to take effect.</p>
          {error && <FormMessage>{error}</FormMessage>}
        </div>
      </div>
    </div>
  );
}
