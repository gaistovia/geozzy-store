import { notFound } from "next/navigation";

/**
 * Catch-all: any URL that is not a real page renders the branded
 * not-found page inside the language layout (instead of Next's default 404).
 * Real pages added later (shop, product, ...) take priority over this route.
 */
export default function CatchAll() {
  notFound();
}
