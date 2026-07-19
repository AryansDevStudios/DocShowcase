"use client";

import React, { forwardRef, memo, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkGemoji from "remark-gemoji";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { CodeBlock } from "@/components/code-block";
import { MermaidBlock } from "@/components/mermaid-block";
import remarkGithubAlerts from "remark-github-alerts";
import "remark-github-alerts/styles/github-base.css";
import "remark-github-alerts/styles/github-colors-light.css";
import "remark-github-alerts/styles/github-colors-dark-class.css";

// Helper to extract text from React children
const extractText = (node: any): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node && node.props && node.props.children) {
    return extractText(node.props.children);
  }
  return "";
};

// Custom remark plugin to fix single-line block math (e.g. $$...$$ on one line)
// remark-math v6 parses single-line $$ as inlineMath inside a paragraph.
function remarkSingleLineMathDisplay() {
  return (tree: any, file: any) => {
    const visit = (node: any, parent: any, index: number) => {
      if (node.type === "paragraph") {
        if (node.children && node.children.length === 1 && node.children[0].type === "inlineMath") {
          const mathNode = node.children[0];
          let isDisplay = false;
          if (file && file.value && mathNode.position && mathNode.position.start && mathNode.position.end) {
            const start = mathNode.position.start.offset;
            const end = mathNode.position.end.offset;
            const raw = file.value.slice(start, end);
            if (raw.startsWith("$$") && raw.endsWith("$$")) {
              isDisplay = true;
            }
          }
          if (isDisplay) {
            mathNode.type = "math";
            mathNode.data = mathNode.data || {};
            mathNode.data.hName = "div";
            mathNode.data.hProperties = { className: ["math", "math-display"] };
            if (parent && parent.children) {
              parent.children[index] = mathNode;
            }
          }
        }
      }
      if (node.children) {
        node.children.forEach((child: any, i: number) => visit(child, node, i));
      }
    };
    visit(tree, null, 0);
  };
}

interface PreviewPaneProps {
  content: string;
  type: "markdown" | "html";
  className?: string;
  onScroll?: React.UIEventHandler<HTMLElement>;
}

export const PreviewPane = memo(forwardRef<HTMLElement, PreviewPaneProps>(
  ({ content, type, className = "", onScroll }, ref) => {
  if (!content.trim()) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        onScroll={onScroll}
        className={`flex items-center justify-center text-muted-foreground text-sm ${className}`}
      >
        <p className="text-center">
          Start typing to see a live preview…
        </p>
      </div>
    );
  }

  if (type === "html") {
    return (
      <iframe
        ref={ref as React.Ref<HTMLIFrameElement>}
        srcDoc={content}
        sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-same-origin allow-pointer-lock allow-orientation-lock allow-top-navigation-by-user-activation"
        allow="autoplay; clipboard-read; clipboard-write; display-capture; fullscreen"
        className={`w-full h-full border-0 bg-white ${className}`}
        title="HTML Preview"
      />
    );
  }

  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const timeout = setTimeout(() => {
        const decodedId = decodeURIComponent(id);
        const element = document.getElementById(decodedId) || document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <div ref={ref as React.Ref<HTMLDivElement>} onScroll={onScroll} className={`preview-content overflow-auto scroll-smooth ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkSingleLineMathDisplay, remarkGemoji, remarkGithubAlerts]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, {
            ...defaultSchema,
            clobberPrefix: '',
            tagNames: [...(defaultSchema.tagNames || []), 'svg', 'path'],
            attributes: {
              ...defaultSchema.attributes,
              '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'id', 'dir', 'style'],
              svg: ['viewBox', 'version', 'width', 'height', 'aria-hidden'],
              path: ['d']
            }
          }],
          rehypeSlug,
          rehypeKatex,
          rehypeHighlight,
        ]}
        components={{
          pre({ children, ...props }: any) {
            if (React.isValidElement(children) && children.type === "code") {
              const codeProps = children.props as any;
              const langMatch = /language-(\w+)/.exec(codeProps.className || "");
              const language = langMatch ? langMatch[1] : "";

              // Render Mermaid diagrams
              if (language === "mermaid") {
                const chart = extractText(codeProps.children);
                return <MermaidBlock chart={chart} />;
              }

              return (
                <CodeBlock
                  node={codeProps.node}
                  className={codeProps.className}
                  {...codeProps}
                >
                  {codeProps.children}
                </CodeBlock>
              );
            }
            return <pre {...props}>{children}</pre>;
          },
          a({ node, href, children, ...props }: any) {
            if (href && href.startsWith("#")) {
              return (
                <a
                  {...props}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const decodedId = decodeURIComponent(targetId);
                    const targetElement = document.getElementById(decodedId) || document.getElementById(targetId);
                    if (targetElement) {
                      targetElement.scrollIntoView({ behavior: 'smooth' });
                      window.history.pushState(null, '', href);
                    }
                  }}
                >
                  {children}
                </a>
              );
            }
            return <a href={href} {...props}>{children}</a>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}));
PreviewPane.displayName = "PreviewPane";
