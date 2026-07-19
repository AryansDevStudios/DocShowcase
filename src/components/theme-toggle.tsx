"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-secondary" aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  const options = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ] as const;

  const currentIndex = options.findIndex((o) => o.value === theme);
  const next = options[(currentIndex + 1) % options.length];
  const CurrentIcon =
    options.find((o) => o.value === theme)?.icon ?? Sun;

  return (
    <button
      onClick={() => setTheme(next.value)}
      className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
      aria-label={`Switch to ${next.label} theme`}
      title={`Current: ${theme}. Click for ${next.label}`}
    >
      <CurrentIcon className="h-4 w-4 text-foreground" />
    </button>
  );
}
