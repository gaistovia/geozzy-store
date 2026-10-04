const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** 60000 -> "TZS 60,000" */
export function formatTZS(amount: number): string {
  return `TZS ${numberFormat.format(Math.round(amount))}`;
}

/** Date and time in East Africa Time, e.g. "2 Oct 2026, 14:30". */
export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Dar_es_Salaam",
  }).format(typeof value === "string" ? new Date(value) : value);
}

/** "Black Hermès slides!" -> "black-hermes-slides" (matches the database slug rule). */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}
