"use client";

import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { EditorSettingsDialog } from "@/components/editor-settings-dialog";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md print:hidden">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center shrink-0">
              <Image src="/logo.svg" alt="DocShowcase Logo" width={32} height={32} className="h-full w-full drop-shadow-md" />
            </div>
            <span id="header-logo-text" className="text-lg font-semibold tracking-tight">
              DocShowcase
            </span>
          </Link>
          <div id="header-mobile-portal" className="flex-1 min-w-0 md:hidden" />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/editor"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Doc</span>
          </Link>
          <ThemeToggle />
          <EditorSettingsDialog />
        </div>
      </div>
    </header>
  );
}
