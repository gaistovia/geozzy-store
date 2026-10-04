"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  CART_STORAGE_KEY,
  cartCount,
  cartReducer,
  cartSubtotal,
  parseStoredCart,
  type CartLine,
} from "@/lib/cart";

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  /** False until the saved cart has been read from this device (avoids server/client mismatch). */
  ready: boolean;
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  replaceVariant: (fromVariantId: string, line: CartLine) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, dispatch] = useReducer(cartReducer, [] as CartLine[]);
  const [ready, setReady] = useState(false);
  const skipNextWrite = useRef(true);

  // Read the saved cart once, and follow changes made in other tabs.
  useEffect(() => {
    try {
      dispatch({ type: "hydrate", lines: parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY)) });
    } catch {
      // Storage unavailable (private mode): the cart still works for this visit.
    }
    setReady(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) {
        skipNextWrite.current = true;
        dispatch({ type: "hydrate", lines: parseStoredCart(event.newValue) });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Ignore storage errors.
    }
  }, [lines, ready]);

  const add = useCallback((line: CartLine) => dispatch({ type: "add", line }), []);
  const setQuantity = useCallback(
    (variantId: string, quantity: number) => dispatch({ type: "setQuantity", variantId, quantity }),
    [],
  );
  const remove = useCallback((variantId: string) => dispatch({ type: "remove", variantId }), []);
  const replaceVariant = useCallback(
    (fromVariantId: string, line: CartLine) => dispatch({ type: "replaceVariant", fromVariantId, line }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      subtotal: cartSubtotal(lines),
      ready,
      add,
      setQuantity,
      remove,
      replaceVariant,
      clear,
    }),
    [lines, ready, add, setQuantity, remove, replaceVariant, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}
