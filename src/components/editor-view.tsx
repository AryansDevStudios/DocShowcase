"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Save, Eye, Code, Loader2, Lock, FileText } from "lucide-react";
import { PreviewPane } from "@/components/preview-pane";
import { saveDocument, updateDocument } from "@/lib/actions";
import type { DocType, DocumentData } from "@/lib/types";

const MAX_CONTENT_SIZE = 1_048_576; // 1 MB
const DRAFT_KEY = "docshowcase_unsaved_document";

interface EditorViewProps {
  documentId?: string;
  initialDocument?: DocumentData;
  isEditing?: boolean;
}

export function EditorView({
  documentId,
  initialDocument,
  isEditing = false,
}: EditorViewProps) {
  const router = useRouter();
  const [name, setName] = useState(initialDocument?.name || "");
  const [content, setContent] = useState(initialDocument?.content || "");
  const [docType, setDocType] = useState<DocType>(
    initialDocument?.type || "markdown"
  );
  const [passkey, setPasskey] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const logoText = document.getElementById("header-logo-text");
    if (logoText) {
      logoText.classList.add("max-md:hidden");
    }
    return () => {
      if (logoText) {
        logoText.classList.remove("max-md:hidden");
      }
    };
  }, []);

  // Refs for scroll sync
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLElement>(null);
  const isScrollingRef = useRef<"editor" | "preview" | null>(null);

  // Draft recovery — only for new documents
  useEffect(() => {
    if (!isEditing && !initialDocument) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          if (draft.name) setName(draft.name);
          if (draft.content) setContent(draft.content);
          if (draft.docType) setDocType(draft.docType);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [isEditing, initialDocument]);

  // Auto-save draft — only for new documents
  useEffect(() => {
    if (!isEditing && !documentId) {
      const timer = setTimeout(() => {
        try {
          localStorage.setItem(
            DRAFT_KEY,
            JSON.stringify({ name, content, docType })
          );
        } catch {
          // Ignore storage errors
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [name, content, docType, isEditing, documentId]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      const byteSize = new TextEncoder().encode(newContent).length;
      if (byteSize > MAX_CONTENT_SIZE) {
        // Reject the change — content too large
        return;
      }
      setContent(newContent);
    },
    []
  );

  const [editorWidth, setEditorWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // Resize handler
  useEffect(() => {
    if (!isDragging) return;
    
    const onMouseMove = (e: MouseEvent) => {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 15 && newWidth < 85) {
        setEditorWidth(newWidth);
      }
    };
    const onMouseUp = () => setIsDragging(false);
    
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging]);

  const handleEditorScroll = useCallback(() => {
    if (isScrollingRef.current === "preview" || docType === "html") return;
    isScrollingRef.current = "editor";
    
    const editor = editorRef.current;
    const preview = previewRef.current as HTMLDivElement;
    
    if (!editor || !preview) return;

    const editorScrollable = editor.scrollHeight - editor.clientHeight;
    if (editorScrollable > 0) {
      const scrollPercentage = editor.scrollTop / editorScrollable;
      const previewScrollable = preview.scrollHeight - preview.clientHeight;
      preview.scrollTop = scrollPercentage * previewScrollable;
    }

    clearTimeout((window as any).scrollSyncTimeout);
    (window as any).scrollSyncTimeout = setTimeout(() => {
      isScrollingRef.current = null;
    }, 100);
  }, [docType]);

  const handlePreviewScroll = useCallback(() => {
    if (isScrollingRef.current === "editor" || docType === "html") return;
    isScrollingRef.current = "preview";
    
    const editor = editorRef.current;
    const preview = previewRef.current as HTMLDivElement;
    
    if (!editor || !preview) return;

    const previewScrollable = preview.scrollHeight - preview.clientHeight;
    if (previewScrollable > 0) {
      const scrollPercentage = preview.scrollTop / previewScrollable;
      const editorScrollable = editor.scrollHeight - editor.clientHeight;
      editor.scrollTop = scrollPercentage * editorScrollable;
    }

    clearTimeout((window as any).scrollSyncTimeout);
    (window as any).scrollSyncTimeout = setTimeout(() => {
      isScrollingRef.current = null;
    }, 100);
  }, [docType]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);

    try {
      let result;
      if (isEditing && documentId) {
        result = await updateDocument(documentId, name, content, docType);
      } else {
        result = await saveDocument(
          name,
          content,
          docType,
          passkey.trim() || null
        );
      }

      if (result.error) {
        alert(result.error);
        return;
      }

      // Clear draft on successful save
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Ignore
      }

      if (result.id) {
        router.push(`/share/${result.id}`);
      }
    } catch {
      alert("Failed to save document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const contentByteSize = new TextEncoder().encode(content).length;
  const sizePercent = Math.min((contentByteSize / MAX_CONTENT_SIZE) * 100, 100);
  const isNearLimit = sizePercent > 80;

  return (
    <div className="absolute inset-0 flex flex-col min-h-0 bg-background">
        {/* Document Name - Portaled to Main Header on Mobile */}
        {mounted && document.getElementById("header-mobile-portal")
          ? createPortal(
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Document name (optional)"
                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:border-input focus:bg-background focus:outline-none transition-colors"
              />,
              document.getElementById("header-mobile-portal")!
            )
          : null}

        {/* Mobile Toolbar */}
      <div className="flex md:hidden flex-col border-b border-border bg-card">
        {/* Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
          <div className="flex items-center gap-2">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocType)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
            
            {!isEditing && (
              <div className="relative w-[130px]">
                <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Passkey (optional)"
                  className="w-full rounded-md border border-input bg-background pl-6 pr-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
            
            {/* Size indicator */}
            <div
              className={`text-[10px] tabular-nums ${
                isNearLimit ? "text-destructive font-medium" : "text-muted-foreground"
              }`}
            >
              {(contentByteSize / 1024).toFixed(0)}KB/1MB
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span className="hidden min-[360px]:inline">
              {isEditing ? "Update" : "Save"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Tabs */}
      <div className="flex md:hidden border-b border-border bg-card">
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "editor"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Code className="h-4 w-4" />
          Editor
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "preview"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {/* Desktop Toolbar */}
      <div className="hidden md:flex items-center gap-2 border-b border-border bg-card px-4 py-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Document name (optional)"
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="flex items-center gap-2">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer shrink-0"
          >
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
          </select>

          {!isEditing && (
            <div className="relative shrink-0">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Passkey (optional)"
                className="rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-[160px]"
              />
            </div>
          )}

          <div
            className={`text-xs tabular-nums shrink-0 ${
              isNearLimit ? "text-destructive font-medium" : "text-muted-foreground"
            }`}
          >
            {(contentByteSize / 1024).toFixed(0)}KB / 1MB
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isEditing ? "Update" : "Save & Share"}
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Transparent overlay while dragging to prevent iframe stealing events */}
        {isDragging && <div className="absolute inset-0 z-50 cursor-col-resize" />}
        
        {/* Editor pane */}
        <div
          style={{ "--pane-width": `${editorWidth}%` } as React.CSSProperties}
          className={`${
            activeTab === "editor" ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-[var(--pane-width)] min-h-0`}
        >
          <textarea
            ref={editorRef}
            onScroll={handleEditorScroll}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={
              docType === "markdown"
                ? "# Hello World\n\nStart writing your **Markdown** here...\n\n$$E = mc^2$$"
                : "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>"
            }
            className="flex-1 resize-none p-4 bg-background text-foreground font-mono text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none min-h-0"
            spellCheck={false}
          />
        </div>

        {/* Resize handle */}
        <div 
          onMouseDown={startDrag}
          className="hidden md:flex w-1.5 bg-border hover:bg-primary/50 transition-colors cursor-col-resize active:bg-primary z-10"
        />

        {/* Preview pane */}
        <div
          style={{ "--pane-width": `${100 - editorWidth}%` } as React.CSSProperties}
          className={`${
            activeTab === "preview" ? "flex" : "hidden"
          } md:flex flex-col w-full md:w-[var(--pane-width)] min-h-0 bg-background`}
        >
          <div className="hidden md:flex items-center gap-1.5 px-4 py-1.5 text-xs text-muted-foreground border-b border-border bg-muted/50">
            <Eye className="h-3 w-3" />
            Preview
          </div>
          <PreviewPane
            ref={previewRef}
            onScroll={handlePreviewScroll}
            content={content}
            type={docType}
            className="flex-1 p-4 overflow-auto min-h-0"
          />
        </div>
      </div>
    </div>
  );
}
