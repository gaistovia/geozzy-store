"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/ui/icons";

/** Light/dark switch. The initial theme is set by an inline script in the layout (no flash). */
export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      window.localStorage.setItem("gz-theme", next ? "dark" : "light");
    } catch {
      // Ignore: the choice just will not persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted sm:size-10"
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
