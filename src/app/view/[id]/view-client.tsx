"use client";

import { useState, useEffect } from "react";
import { Code, Pencil } from "lucide-react";
import { PreviewPane } from "@/components/preview-pane";
import Link from "next/link";

interface ViewDocumentClientProps {
  documentId: string;
  document: {
    name: string;
    content: string;
    type: "markdown" | "html";
    passkeyHash: string | null;
    updatedAt?: number;
  };
  uihidden?: boolean;
  display?: string;
}

export function ViewDocumentClient({
  documentId,
  document,
  uihidden,
  display,
}: ViewDocumentClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showGui = display !== "compact" && display !== "extended";
  const useFullWidth = display === "extended";

  // For HTML documents
  if (document.type === "html") {
    if (showGui) {
      return (
        <iframe
          srcDoc={document.content}
          sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-same-origin allow-pointer-lock allow-orientation-lock allow-top-navigation-by-user-activation"
          allow="autoplay; clipboard-read; clipboard-write; display-capture; fullscreen"
          className="w-full h-[calc(100vh-8rem)] border-0 bg-white rounded-xl shadow-sm my-8 max-w-6xl mx-auto"
          title={document.name || "HTML Document"}
        />
      );
    }
    return (
      <iframe
        srcDoc={document.content}
        sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-same-origin allow-pointer-lock allow-orientation-lock allow-top-navigation-by-user-activation"
        allow="autoplay; clipboard-read; clipboard-write; display-capture; fullscreen"
        className="fixed inset-0 z-[100] w-full h-[100dvh] border-0 bg-white"
        title={document.name || "HTML Document"}
      />
    );
  }

  // For Markdown documents
  const contentWidthClass = useFullWidth ? "w-full" : "mx-auto w-full max-w-4xl";

  const content = (
    <div className={`${contentWidthClass} px-4 py-8`}>
      {showGui && (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {document.name && (
              <h1 className="text-2xl font-bold tracking-tight">
                {document.name}
              </h1>
            )}
          </div>
          
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
      )}

      <div className={showGui ? "rounded-xl border border-border bg-card p-6 sm:p-8" : "p-4 sm:p-8"}>
        <PreviewPane content={document.content} type="markdown" />
      </div>
    </div>
  );

  if (!showGui) {
    return (
      <div className="fixed inset-0 z-[100] bg-background overflow-auto">
        {content}
      </div>
    );
  }

  return content;
}
