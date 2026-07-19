import { FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
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
