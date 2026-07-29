"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Copy,
  ExternalLink,
  Plus,
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { saveRecentDocument } from "@/lib/recent";

interface ShareClientProps {
  documentId: string;
  documentName: string;
  documentType: "markdown" | "html" | "custom";
  burnAfterReading?: boolean;
  expiresAt?: number | null;
}

export function ShareClient({ documentId, documentName, documentType, burnAfterReading = false, expiresAt = null }: ShareClientProps) {
  const [copied, setCopied] = useState(false);
  const [viewUrl, setViewUrl] = useState("");
  const [format, setFormat] = useState("default");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    saveRecentDocument(documentId, documentName, documentType, "created", expiresAt, burnAfterReading);
    let url = `${window.location.origin}/view/${documentId}`;
    
    if (format === "compact") {
      url += "?display=compact";
    } else if (format === "extended") {
      url += "?display=extended";
    } else if (format === "raw") {
      let ext = "md";
      if (documentType === "html") ext = "html";
      else if (documentType === "custom") {
        const nameExtMatch = documentName?.match(/\.([a-z0-9]+)$/i);
        ext = nameExtMatch ? nameExtMatch[1].toLowerCase() : "txt";
      }
      url = `${window.location.origin}/raw/${documentId}.${ext}`;
    } else if (format === "download") {
      let ext = "md";
      if (documentType === "html") ext = "html";
      else if (documentType === "custom") {
        const nameExtMatch = documentName?.match(/\.([a-z0-9]+)$/i);
        ext = nameExtMatch ? nameExtMatch[1].toLowerCase() : "txt";
      }
      url = `${window.location.origin}/raw/${documentId}.${ext}?display=download`;
    }

    setViewUrl(url);
  }, [documentId, format, documentType]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(viewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = viewUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: documentName || "DocShowcase Document",
          url: viewUrl,
        });
      } catch {
        // User cancelled share
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="w-full max-w-md text-center animate-slide-up">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Document Saved!</h1>
        {documentName && (
          <p className="text-muted-foreground mb-6">&ldquo;{documentName}&rdquo;</p>
        )}
        {!documentName && (
          <p className="text-muted-foreground mb-6">Your document is ready to share</p>
        )}

        {/* URL display */}
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-2">Public URL</p>
          <p className="text-sm font-mono text-foreground break-all select-all">
            {viewUrl}
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy URL
              </>
            )}
          </button>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          )}

          <Link
            href={viewUrl.replace(window.location.origin, "")}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Link>

          <Link
            href="/editor"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Doc
          </Link>
        </div>

        {/* Advanced Options */}
        <div className="text-left rounded-xl border border-border bg-card overflow-hidden transition-all duration-300">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 cursor-pointer"
          >
            Advanced Options
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-4 border-t border-border bg-muted/20 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="format" 
                  value="default" 
                  checked={format === "default"} 
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium">Default Viewer</div>
                  <div className="text-xs text-muted-foreground">Full DocShowcase interface with headers and footers.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="format" 
                  value="compact" 
                  checked={format === "compact"} 
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium">Embed (Compact)</div>
                  <div className="text-xs text-muted-foreground">Clean view without UI — perfect for embedding.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="format" 
                  value="extended" 
                  checked={format === "extended"} 
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium">Full Width</div>
                  <div className="text-xs text-muted-foreground">Edge-to-edge view with no UI — great for presentations.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="format" 
                  value="raw" 
                  checked={format === "raw"} 
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium">Raw Source</div>
                  <div className="text-xs text-muted-foreground">Opens the raw file directly in your browser.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="radio" 
                  name="format" 
                  value="download" 
                  checked={format === "download"} 
                  onChange={(e) => setFormat(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium">Direct Download</div>
                  <div className="text-xs text-muted-foreground">URL will automatically trigger a file download.</div>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
