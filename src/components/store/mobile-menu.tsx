"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";

export interface MenuLink {
  href: string;
  label: string;
}

/** Slide-down navigation for small screens. `children` is the search form (rendered on the server). */
export function MobileMenu({
  links,
  openLabel,
  closeLabel,
  navLabel,
  children,
}: {
  links: MenuLink[];
  openLabel: string;
  closeLabel: string;
  navLabel: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? closeLabel : openLabel}
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-muted"
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-border bg-background px-4 pb-5 pt-3 shadow-lg"
      >
        {children}
        <nav aria-label={navLabel} className="mt-3 flex flex-col">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-2 py-3 text-base font-medium hover:bg-muted"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
