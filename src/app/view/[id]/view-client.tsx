"use client";

import { useState, useEffect } from "react";
import { Pencil, Eye, Printer, Lock, Loader2, AlertTriangle, Clock } from "lucide-react";
import { PreviewPane } from "@/components/preview-pane";
import Link from "next/link";

import { registerView, burnDocument } from "@/lib/actions";
import { saveRecentDocument } from "@/lib/recent";
import { decryptContent } from "@/lib/crypto-client";

interface ViewDocumentClientProps {
  documentId: string;
  document: {
    name: string;
    content: string;
    type: "markdown" | "html" | "custom";
    passkeyHash: string | null;
    views?: number;
    burnAfterReading?: boolean;
    expiresAt?: number | null;
    updatedAt?: number;
  };
  display?: string;
}

export function ViewDocumentClient({
  documentId,
  document,
  display,
}: ViewDocumentClientProps) {
  const [mounted, setMounted] = useState(false);
  const [viewCount, setViewCount] = useState(document.views || 0);
  const [burned, setBurned] = useState(false);

  const isEncrypted = document.content?.startsWith("ENC:");
  const [decryptedContent, setDecryptedContent] = useState<string | null>(
    isEncrypted ? null : document.content
  );
  const [viewPassword, setViewPassword] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState("");

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecrypting(true);
    setDecryptError("");
    try {
      const decrypted = await decryptContent(document.content, viewPassword);
      setDecryptedContent(decrypted);
      // If burn-after-reading, trigger burn AFTER successful decryption
      if (document.burnAfterReading) {
        burnDocument(documentId).catch(console.error);
        setBurned(true);
      }
    } catch (err) {
      setDecryptError("Invalid password or corrupted data");
    } finally {
      setDecrypting(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    saveRecentDocument(documentId, document.name, document.type, "viewed", document.expiresAt || null, document.burnAfterReading || false);

    const viewedKey = `viewed_${documentId}`;
    if (!sessionStorage.getItem(viewedKey)) {
      sessionStorage.setItem(viewedKey, "true");
      registerView(documentId);
      setViewCount((prev) => prev + 1);

      // If burn-after-reading and NOT encrypted, burn now (user can see content immediately)
      if (document.burnAfterReading && !isEncrypted) {
        burnDocument(documentId).catch(console.error);
        setBurned(true);
      }
    }
  }, [documentId, document.name, document.type, document.burnAfterReading, isEncrypted]);

  const showGui = display !== "compact" && display !== "extended";
  const useFullWidth = display === "extended";

  // Compute time-until-expiry string
  const expiryInfo = (() => {
    if (!document.expiresAt) return null;
    const msLeft = document.expiresAt - Date.now();
    if (msLeft <= 0) return "This document has expired.";
    const hours = Math.floor(msLeft / (1000 * 60 * 60));
    const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `This document will self-destruct in ${days} day${days > 1 ? "s" : ""}.`;
    }
    if (hours > 0) {
      return `This document will self-destruct in ${hours}h ${minutes}m.`;
    }
    return `This document will self-destruct in ${minutes} minute${minutes !== 1 ? "s" : ""}.`;
  })();

  // === ENCRYPTION GATE ===
  // If document is encrypted and not yet decrypted, show the decryption form
  // This applies to ALL types (markdown, html, custom) — no early returns before this
  if (decryptedContent === null) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-16">
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-card rounded-xl border border-border">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Encrypted Document</h2>
          <p className="text-muted-foreground text-sm mb-8 text-center max-w-sm">
            This document is end-to-end encrypted. You need the view password to decrypt it.
          </p>
          <form onSubmit={handleDecrypt} className="w-full max-w-sm flex gap-2">
            <input
              type="text"
              name="username"
              value={`docshowcase-view-${documentId}`}
              readOnly
              hidden
              autoComplete="username"
            />
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter view password..."
              value={viewPassword}
              onChange={(e) => setViewPassword(e.target.value)}
              className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
              autoFocus
            />
            <button
              type="submit"
              disabled={decrypting || !viewPassword}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {decrypting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Decrypt"
              )}
            </button>
          </form>
          {decryptError && (
            <p className="text-sm text-destructive mt-4">{decryptError}</p>
          )}
        </div>
      </div>
    );
  }

  // === HTML DOCUMENTS ===
  if (document.type === "html") {
    if (showGui) {
      return (
        <div className="flex flex-col">
          {/* Banners */}
          {burned && (
            <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-center text-sm text-destructive flex items-center justify-center gap-2 print:hidden">
              <AlertTriangle className="h-4 w-4" />
              This document has been burned. It will not be available on your next visit.
            </div>
          )}
          {expiryInfo && !burned && (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-center text-sm text-amber-700 dark:text-amber-400 flex items-center justify-center gap-2 print:hidden">
              <Clock className="h-4 w-4" />
              {expiryInfo}
            </div>
          )}
          <iframe
            srcDoc={decryptedContent}
            sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-same-origin allow-pointer-lock allow-orientation-lock allow-top-navigation-by-user-activation"
            allow="autoplay; clipboard-read; clipboard-write; display-capture; fullscreen"
            className="w-full h-[calc(100vh-8rem)] border-0 bg-white rounded-xl shadow-sm my-8 max-w-6xl mx-auto"
            title={document.name || "HTML Document"}
          />
        </div>
      );
    }
    return (
      <iframe
        srcDoc={decryptedContent}
        sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-same-origin allow-pointer-lock allow-orientation-lock allow-top-navigation-by-user-activation"
        allow="autoplay; clipboard-read; clipboard-write; display-capture; fullscreen"
        className="fixed inset-0 z-[100] w-full h-[100dvh] border-0 bg-white"
        title={document.name || "HTML Document"}
      />
    );
  }

  // === MARKDOWN & CUSTOM DOCUMENTS ===
  const contentWidthClass = useFullWidth
    ? "w-full"
    : "mx-auto w-full max-w-4xl";

  const renderedContent = (
    <div className={`${contentWidthClass} px-0 sm:px-4 py-4 sm:py-8`}>
      {/* Banners */}
      {burned && showGui && (
        <div className="mb-4 mx-4 sm:mx-0 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-center gap-2 print:hidden">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          This document has been burned. It will not be available on your next visit.
        </div>
      )}
      {expiryInfo && !burned && showGui && (
        <div className="mb-4 mx-4 sm:mx-0 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2 print:hidden">
          <Clock className="h-4 w-4 shrink-0" />
          {expiryInfo}
        </div>
      )}

      {showGui && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 px-4 sm:px-0 print:hidden">
          <div className="flex-1 min-w-0 flex items-center gap-4">
            {document.name && (
              <h1 className="text-2xl font-bold tracking-tight">
                {document.name}
              </h1>
            )}
            {viewCount > 0 && (
              <div
                className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md"
                title={`${viewCount} views`}
              >
                <Eye className="h-4 w-4" />
                <span>{viewCount}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              PDF
            </button>

            {document.passkeyHash && (
              <Link
                href={`/edit/${documentId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            )}
          </div>
        </div>
      )}

      <div
        className={
          showGui
            ? "rounded-none sm:rounded-xl border-y sm:border-x border-border bg-card px-3 py-6 sm:p-8 print:border-none print:shadow-none print:bg-transparent print:p-0"
            : "px-3 py-6 sm:p-8 print:p-0"
        }
      >
        <PreviewPane content={decryptedContent} type={document.type} />
      </div>
    </div>
  );

  if (!showGui) {
    return (
      <div className="fixed inset-0 z-[100] bg-background overflow-auto">
        {renderedContent}
      </div>
    );
  }

  return renderedContent;
}
