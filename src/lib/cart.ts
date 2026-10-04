import { z } from "zod";

export const MAX_LINE_QUANTITY = 20;
export const MAX_CART_LINES = 30;
export const CART_STORAGE_KEY = "geozzy-cart-v1";

export const cartLineSchema = z.object({
  variantId: z.string().uuid(),
  productId: z.string().uuid(),
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  imagePath: z.string().max(300).nullable(),
  size: z.string().max(40).nullable(),
  color: z.string().max(40).nullable(),
  unitPrice: z.number().int().min(0),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});

export type CartLine = z.infer<typeof cartLineSchema>;

/** Reads and validates saved cart data. Anything corrupt is dropped. */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const lines: CartLine[] = [];
    for (const item of parsed) {
      const result = cartLineSchema.safeParse(item);
      if (result.success) lines.push(result.data);
    }
    return lines.slice(0, MAX_CART_LINES);
  } catch {
    return [];
  }
}

export type CartAction =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; line: CartLine }
  | { type: "setQuantity"; variantId: string; quantity: number }
  | { type: "remove"; variantId: string }
  | { type: "replaceVariant"; fromVariantId: string; line: CartLine }
  | { type: "clear" };

const clampQuantity = (q: number) => Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.floor(q)));

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;
    case "add": {
      const existing = lines.find((l) => l.variantId === action.line.variantId);
      if (existing) {
        return lines.map((l) =>
          l.variantId === existing.variantId
            ? { ...l, unitPrice: action.line.unitPrice, quantity: clampQuantity(l.quantity + action.line.quantity) }
            : l,
        );
      }
      if (lines.length >= MAX_CART_LINES) return lines;
      return [...lines, { ...action.line, quantity: clampQuantity(action.line.quantity) }];
    }
    case "setQuantity":
      return lines.map((l) =>
        l.variantId === action.variantId ? { ...l, quantity: clampQuantity(action.quantity) } : l,
      );
    case "remove":
      return lines.filter((l) => l.variantId !== action.variantId);
    case "replaceVariant": {
      const target = lines.find((l) => l.variantId === action.line.variantId);
      const without = lines.filter((l) => l.variantId !== action.fromVariantId);
      if (target && target.variantId !== action.fromVariantId) {
        // Switching to an option that is already in the cart: merge the quantities.
        return without.map((l) =>
          l.variantId === target.variantId
            ? { ...l, quantity: clampQuantity(l.quantity + action.line.quantity) }
            : l,
        );
      }
      return lines.map((l) => (l.variantId === action.fromVariantId ? action.line : l));
    }
    case "clear":
      return [];
  }
}

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
