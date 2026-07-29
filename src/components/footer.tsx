import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background print:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Image src="/logo.svg" alt="" width={14} height={14} className="opacity-70" />
          <span>DocShowcase</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Built by{" "}
          <span className="font-medium text-foreground">AryansDevStudios</span>
        </p>
      </div>
    </footer>
  );
}
