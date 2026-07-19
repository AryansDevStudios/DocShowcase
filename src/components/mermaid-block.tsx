"use client";

import React, { useEffect, useRef, useState, useId } from "react";
import { useTheme } from "next-themes";

interface MermaidBlockProps {
  chart: string;
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const { resolvedTheme } = useTheme();

  const containerRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const uniqueId = useId().replace(/:/g, "_");

  useEffect(() => {
    if (!chart.trim()) return;

    let cancelled = false;
    const renderId = `mermaid_${uniqueId}_${++renderCountRef.current}`;

    (async () => {
      try {
        // Dynamic import to avoid SSR issues
        const mermaid = (await import("mermaid")).default;
        
        // Treat undefined as light mode on first render for SSR matching
        const isDark = resolvedTheme === "dark";
        
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          themeVariables: isDark 
            ? {
                fontFamily: "inherit",
                background: "#0d1117",
                primaryColor: "#161b22",
                primaryTextColor: "#c9d1d9",
                primaryBorderColor: "#30363d",
                lineColor: "#8b949e",
                secondaryColor: "#0d1117",
                tertiaryColor: "#0d1117",
                noteBkgColor: "#2b2b2b",
                noteBorderColor: "#30363d",
                noteTextColor: "#c9d1d9",
              }
            : {
                fontFamily: "inherit",
                background: "#f1f5f9",
                primaryColor: "#ffffff",
                primaryTextColor: "#334155",
                primaryBorderColor: "#cbd5e1",
                lineColor: "#64748b",
                secondaryColor: "#f8fafc",
                tertiaryColor: "#f1f5f9",
                noteBkgColor: "#fef08a",
                noteBorderColor: "#eab308",
                noteTextColor: "#334155",
              },
          securityLevel: "loose",
          fontFamily: "inherit",
        });

        const { svg: renderedSvg } = await mermaid.render(
          renderId,
          chart.trim()
        );

        if (!cancelled) {
          setSvg(renderedSvg);
          setError("");
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to render Mermaid diagram");
          setSvg("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, uniqueId, resolvedTheme]);

  if (error) {
    return (
      <div className="my-6 rounded-xl overflow-hidden border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 shadow-sm">
        <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 font-mono">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span className="font-semibold">Mermaid Error</span>
        </div>
        <div className="p-4 text-sm text-red-700 dark:text-red-300 font-mono whitespace-pre-wrap">
          {error}
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="my-6 flex items-center justify-center py-12 rounded-xl border border-border bg-[var(--mermaid-bg)]">
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Rendering diagram…
        </div>
      </div>
    );
  }

  return (
    <div className="my-6 rounded-xl overflow-hidden border border-border bg-[var(--mermaid-bg)] shadow-sm">
      <div className="flex items-center px-4 py-2 bg-[var(--mermaid-header)] border-b border-border/50 text-xs text-slate-600 dark:text-slate-400 font-sans">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <rect x="9" y="15" width="6" height="6" rx="1" />
            <path d="M6 9v2c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V9" />
            <path d="M12 13v2" />
          </svg>
          <span className="font-semibold">Flowchart</span>
        </div>
      </div>
      <div
        ref={containerRef}
        className="p-6 flex items-center justify-center overflow-x-auto [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}
