"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  node?: any;
}

// Helper to extract raw text from React children (useful when rehype-highlight transforms it)
const extractText = (node: any): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && node.props && node.props.children) {
    return extractText(node.props.children);
  }
  return "";
};

export function CodeBlock({ children, className, node, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Check if there is a language class
  const match = /language-(\w+)/.exec(className || "");

  // Extract language and meta (filename)
  let language = match ? match[1] : "text";
  let meta = node?.data?.meta || node?.properties?.meta || "";

  // Sometimes the meta is lumped into className like language-typescript:utils.ts
  if (!meta && className?.includes(":")) {
    const parts = className.split(":");
    if (parts.length > 1) {
      meta = parts.slice(1).join(":");
      // Strip out hljs classes that might have been appended
      meta = meta.split(" ")[0];
    }
  }

  const rawCode = extractText(children);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="relative my-6 rounded-xl overflow-hidden border border-border bg-[var(--code-bg)] shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--code-header)] border-b border-border/50 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-3">
          <span className="text-primary font-semibold">{language}</span>
          {meta && (
            <>
              <span className="w-1 h-1 rounded-full bg-border/50" />
              <span className="text-muted-foreground/80">{meta}</span>
            </>
          )}
        </div>
        
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed whitespace-pre">
        <code className={`${className || ""} block-code`} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
}
