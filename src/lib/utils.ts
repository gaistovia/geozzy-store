import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Join class names, skipping falsy values. When two classes conflict (e.g. two background colours) the LAST one wins. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
