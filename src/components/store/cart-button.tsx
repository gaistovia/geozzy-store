"use client";

import Link from "next/link";
import { CartIcon } from "@/components/ui/icons";
import { useCart } from "@/components/store/cart-provider";

export function CartButton({ href, label }: { href: string; label: string }) {
  const { count, ready } = useCart();
  const shown = ready ? count : 0;
  return (
    <Link
      href={href}
      aria-label={shown > 0 ? `${label} (${shown})` : label}
      className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
    >
      <CartIcon />
      {shown > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-gold-500 px-1 text-[0.7rem] font-bold leading-5 text-[#1c1708]"
        >
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </Link>
  );
}
