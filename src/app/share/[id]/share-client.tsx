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
} from "lucide-react";

interface ShareClientProps {
  documentId: string;
  documentName: string;
}

export function ShareClient({ documentId, documentName }: ShareClientProps) {
  const [copied, setCopied] = useState(false);
  const [viewUrl, setViewUrl] = useState("");

  useEffect(() => {
    setViewUrl(`${window.location.origin}/view/${documentId}`);
  }, [documentId]);

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
        <div className="grid grid-cols-2 gap-3">
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

          {"share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          )}

          <Link
            href={`/view/${documentId}`}
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
      </div>
    </div>
  );
}
