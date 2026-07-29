"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Save, Eye, Code, Loader2, Lock, Settings, X, Settings2 } from "lucide-react";
import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useEditorSettings } from "@/hooks/use-editor-settings";
import { PreviewPane } from "@/components/preview-pane";
import { saveDocument, updateDocument } from "@/lib/actions";
import { encryptContent, decryptContent } from "@/lib/crypto-client";
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
  const [viewPassword, setViewPassword] = useState("");
  const [expiration, setExpiration] = useState<"never" | "burn" | "1h" | "24h" | "7d">("never");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { settings, isLoaded } = useEditorSettings();

  const [isDesktop, setIsDesktop] = useState(true);
  const [previewContent, setPreviewContent] = useState(initialDocument?.content || "");

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (isDesktop || activeTab === "preview") {
      setPreviewContent(content);
    }
  }, [content, isDesktop, activeTab]);

  const [isEncrypted, setIsEncrypted] = useState(initialDocument?.content.startsWith("ENC:") || false);
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState("");

  const handleInitialDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setDecrypting(true);
    setDecryptError("");
    try {
      const decrypted = await decryptContent(content, viewPassword);
      setContent(decrypted);
      setIsEncrypted(false);
    } catch (err) {
      setDecryptError("Invalid view password or corrupted data");
    } finally {
      setDecrypting(false);
    }
  };

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

  const activePaneRef = useRef<"editor" | "preview" | null>(null);
  const monacoEditorRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleEditorBeforeMount = (monaco: any) => {
    monaco.editor.defineTheme("dark-2026", {
      base: "vs-dark",
      inherit: true,
      rules: [{ background: "0d0d0d" }],
      colors: {
        "editor.background": "#0d0d0d",
        "editor.foreground": "#cccccc",
        "editorCursor.foreground": "#007acc",
        "editor.lineHighlightBackground": "#1f1f1f",
        "editorLineNumber.foreground": "#505050",
        "editorIndentGuide.background": "#202020",
        "editorIndentGuide.activeBackground": "#404040",
      }
    });
    monaco.editor.defineTheme("light-2026", {
      base: "vs",
      inherit: true,
      rules: [{ background: "fcfcfc" }],
      colors: {
        "editor.background": "#fcfcfc",
        "editor.foreground": "#333333",
        "editorCursor.foreground": "#005cc5",
        "editor.lineHighlightBackground": "#f0f0f0",
        "editorLineNumber.foreground": "#a0a0a0",
        "editorIndentGuide.background": "#e0e0e0",
        "editorIndentGuide.activeBackground": "#c0c0c0",
      }
    });
  };

  const handleEditorDidMount = (editor: any) => {
    monacoEditorRef.current = editor;

    editor.onDidScrollChange((e: any) => {
      if (docType === "html" || settings.engine !== "monaco") return;
      if (activePaneRef.current !== "editor") return;
      
      const preview = previewRef.current as HTMLDivElement;
      if (!preview) return;

      const editorLayout = editor.getLayoutInfo();
      if (!editorLayout) return;

      const editorScrollable = e.scrollHeight - editorLayout.height;
      if (editorScrollable > 0) {
        const scrollPercentage = e.scrollTop / editorScrollable;
        const previewScrollable = preview.scrollHeight - preview.clientHeight;
        const newPreviewScrollTop = scrollPercentage * previewScrollable;
        
        if (Math.abs(preview.scrollTop - newPreviewScrollTop) > 1) {
          preview.scrollTop = newPreviewScrollTop;
        }
      }
    });
  };

  const handleTextareaScroll = useCallback(() => {
    if (docType === "html" || settings.engine !== "standard") return;
    if (activePaneRef.current !== "editor") return;
    
    const textarea = textareaRef.current;
    const preview = previewRef.current as HTMLDivElement;
    
    if (!textarea || !preview) return;

    const textareaScrollable = textarea.scrollHeight - textarea.clientHeight;
    if (textareaScrollable > 0) {
      const scrollPercentage = textarea.scrollTop / textareaScrollable;
      const previewScrollable = preview.scrollHeight - preview.clientHeight;
      const newPreviewScrollTop = scrollPercentage * previewScrollable;
      
      if (Math.abs(preview.scrollTop - newPreviewScrollTop) > 1) {
        preview.scrollTop = newPreviewScrollTop;
      }
    }
  }, [docType, settings.engine]);

  const handlePreviewScroll = useCallback(() => {
    if (docType === "html") return;
    if (activePaneRef.current !== "preview") return;
    
    const preview = previewRef.current as HTMLDivElement;
    if (!preview) return;
    const previewScrollable = preview.scrollHeight - preview.clientHeight;

    const editor = monacoEditorRef.current;
    const textarea = textareaRef.current;
    
    if (settings.engine === "monaco" && editor) {
      if (previewScrollable > 0) {
        const scrollPercentage = preview.scrollTop / previewScrollable;
        const editorLayout = editor.getLayoutInfo();
        if (editorLayout) {
          const editorScrollable = editor.getScrollHeight() - editorLayout.height;
          const newEditorScrollTop = scrollPercentage * editorScrollable;
          if (Math.abs(editor.getScrollTop() - newEditorScrollTop) > 1) {
            editor.setScrollTop(newEditorScrollTop);
          }
        }
      }
    } else if (settings.engine === "standard" && textarea) {
      if (previewScrollable > 0) {
        const scrollPercentage = preview.scrollTop / previewScrollable;
        const textareaScrollable = textarea.scrollHeight - textarea.clientHeight;
        const newTextareaScrollTop = scrollPercentage * textareaScrollable;
        if (Math.abs(textarea.scrollTop - newTextareaScrollTop) > 1) {
          textarea.scrollTop = newTextareaScrollTop;
        }
      }
    }
  }, [docType, settings.engine]);

  const handleSave = async () => {
    if (!content.trim()) return;

    // Custom format validation: require a file extension in the name
    if (docType === "custom" && !name.match(/\.[a-z0-9]+$/i)) {
      alert("Custom format requires a file extension in the document name (e.g., script.py, styles.css)");
      return;
    }

    // Auto-detect type from extension
    let effectiveType = docType;
    if (name.match(/\.md$/i)) effectiveType = "markdown";
    else if (name.match(/\.(html?|htm)$/i)) effectiveType = "html";

    setSaving(true);

    try {
      let contentToSave = content;
      if (viewPassword.trim()) {
        contentToSave = await encryptContent(content, viewPassword.trim());
      }

      let result;
      if (isEditing && documentId) {
        result = await updateDocument(documentId, name, contentToSave, effectiveType);
      } else {
        result = await saveDocument(
          name,
          contentToSave,
          effectiveType,
          passkey.trim() || null,
          expiration
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
                placeholder={docType === "custom" ? "Document name (required, e.g., script.py)" : "Document name (optional)"}
                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-base font-semibold text-foreground placeholder:text-muted-foreground focus:border-input focus:bg-background focus:outline-none transition-colors"
              />,
              document.getElementById("header-mobile-portal")!
            )
          : null}

      {/* Mobile Toolbar */}
      <div className="flex md:hidden flex-col border-b border-border bg-card relative z-20">
        {/* Compact Default View (Always visible) */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
              <SelectTrigger className="h-8 w-[145px] text-xs">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="custom">Custom Format</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setShowMobileSettings(!showMobileSettings)}
              className={`flex items-center justify-center rounded-md border border-input p-1.5 text-xs font-medium transition-colors cursor-pointer ${
                showMobileSettings 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-background text-foreground hover:bg-muted"
              }`}
              title="Settings"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>

            <div
              className={`text-[10px] tabular-nums whitespace-nowrap ${
                isNearLimit ? "text-destructive font-medium" : "text-muted-foreground"
              }`}
            >
              {(contentByteSize / 1024).toFixed(0)}KB / 1MB
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{isEditing ? "Update" : "Save"}</span>
          </button>
        </div>

        {/* Collapsible Settings Panel */}
        {showMobileSettings && (
          <div className="flex flex-col gap-3 px-3 pb-4 pt-2 border-t border-border/50 bg-muted/10 animate-in slide-in-from-top-2">
            {/* Format & Expiry Row */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] uppercase text-muted-foreground font-semibold px-1">Timer</label>
                  <Select value={expiration} onValueChange={(v) => setExpiration(v as any)}>
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue placeholder="Timer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Keep Forever</SelectItem>
                      <SelectItem value="burn">Burn After Reading</SelectItem>
                      <SelectItem value="1h">Delete in 1 hr</SelectItem>
                      <SelectItem value="24h">Delete in 24 hr</SelectItem>
                      <SelectItem value="7d">Delete in 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Security Row */}
            {!isEditing && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <input
                    type="password"
                    name="edit-passkey"
                    autoComplete="new-password"
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="Edit Passkey (optional)"
                    className="w-full rounded-md border border-input bg-background pl-6 pr-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="relative flex-1">
                  <Eye className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <input
                    type="password"
                    name="view-password"
                    autoComplete="new-password"
                    value={viewPassword}
                    onChange={(e) => setViewPassword(e.target.value)}
                    placeholder="View Password (optional)"
                    className="w-full rounded-md border border-input bg-background pl-6 pr-2 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
            )}
          </div>
        )}
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
          placeholder={docType === "custom" ? "Document name (required, e.g., script.py)" : "Document name (optional)"}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <div className="flex items-center gap-2">
          <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
            <SelectTrigger className="h-8 w-[160px] text-sm">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown">Markdown</SelectItem>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="custom">Custom Format</SelectItem>
            </SelectContent>
          </Select>

          {!isEditing && (
            <div className="flex gap-2">
              <div className="relative shrink-0">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="password"
                  name="edit-passkey"
                  autoComplete="new-password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  placeholder="Edit Passkey (optional)"
                  className="rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-[130px]"
                />
              </div>
              <div className="relative shrink-0">
                <Eye className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="password"
                  name="view-password"
                  autoComplete="new-password"
                  value={viewPassword}
                  onChange={(e) => setViewPassword(e.target.value)}
                  placeholder="View Password (optional)"
                  title="End-to-End Encrypt this document"
                  className="rounded-lg border border-input bg-background pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-[130px]"
                />
              </div>
            </div>
          )}

          {!isEditing && (
            <Select value={expiration} onValueChange={(v) => setExpiration(v as any)}>
              <SelectTrigger className="h-8 w-[160px] text-sm" title="Self-Destruct Timer">
                <SelectValue placeholder="Timer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Keep Forever</SelectItem>
                <SelectItem value="burn">Burn After Reading</SelectItem>
                <SelectItem value="1h">Delete in 1 hour</SelectItem>
                <SelectItem value="24h">Delete in 24 hours</SelectItem>
                <SelectItem value="7d">Delete in 7 days</SelectItem>
              </SelectContent>
            </Select>
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
        {isEncrypted ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card border-x border-border">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Encrypted Document</h2>
            <p className="text-muted-foreground text-sm mb-8 text-center max-w-sm">
              This document is end-to-end encrypted. Enter the view password to edit its contents.
            </p>
            <form onSubmit={handleInitialDecrypt} className="w-full max-w-sm flex gap-2">
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
              />
              <button
                type="submit"
                disabled={decrypting || !viewPassword}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {decrypting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Decrypt"}
              </button>
            </form>
            {decryptError && (
              <p className="text-sm text-destructive mt-4">{decryptError}</p>
            )}
            <button 
              type="button" 
              onClick={() => {
                setContent("");
                setIsEncrypted(false);
              }}
              className="mt-8 text-sm text-muted-foreground hover:text-foreground underline decoration-dashed underline-offset-4"
            >
              Or clear content and overwrite
            </button>
          </div>
        ) : (
          <div 
            className="flex-1 h-full min-h-0 relative bg-background"
            onMouseEnter={() => { activePaneRef.current = "editor"; }}
            onTouchStart={() => { activePaneRef.current = "editor"; }}
          >
            {!isLoaded ? null : settings.engine === "standard" ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                onScroll={handleTextareaScroll}
                className="absolute inset-0 w-full h-full resize-none bg-background p-4 font-mono text-sm text-foreground focus:outline-none focus:ring-0 leading-relaxed"
                placeholder="Paste or type your document here..."
                spellCheck={false}
              />
            ) : (
              <Editor
                height="100%"
                language={(() => {
                  if (docType === "markdown") return "markdown";
                  if (docType === "html") return "html";
                  if (docType === "custom") {
                    const match = name.match(/\.([a-z0-9]+)$/i);
                    if (match) {
                      const ext = match[1].toLowerCase();
                      const extMap: Record<string, string> = {
                        js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript",
                        py: "python", rb: "ruby", rs: "rust", go: "go",
                        c: "c", cpp: "cpp", cs: "csharp", java: "java",
                        html: "html", css: "css", scss: "scss", less: "less",
                        json: "json", md: "markdown", sql: "sql",
                        yml: "yaml", yaml: "yaml", xml: "xml",
                        sh: "shell", bash: "shell", zsh: "shell",
                        php: "php", swift: "swift", kt: "kotlin",
                      };
                      return extMap[ext] || ext;
                    }
                  }
                  return "plaintext";
                })()}
                theme={
                  settings.theme === "match-app"
                    ? resolvedTheme === "dark"
                      ? "vs-dark"
                      : "light"
                    : settings.theme
                }
                value={content}
                beforeMount={handleEditorBeforeMount}
                onMount={handleEditorDidMount}
                onChange={(value) => handleContentChange(value || "")}
                options={{
                  automaticLayout: true,
                  padding: { top: 16 },
                  lineNumbersMinChars: 3,
                  lineDecorationsWidth: 0,
                  minimap: { enabled: settings.minimap, renderCharacters: settings.minimapRenderCharacters },
                  wordWrap: settings.wordWrap === "auto" ? (docType === "markdown" ? "on" : "off") : settings.wordWrap,
                  fontFamily: settings.fontFamily,
                  fontSize: settings.fontSize,
                  fontLigatures: settings.fontLigatures,
                  lineHeight: settings.lineHeight === 1.5 ? settings.fontSize * 1.5 : settings.lineHeight === 2 ? settings.fontSize * 2 : 0,
                  letterSpacing: settings.letterSpacing,
                  renderWhitespace: settings.renderWhitespace,
                  lineNumbers: settings.lineNumbers,
                  renderLineHighlight: settings.renderLineHighlight,
                  cursorStyle: settings.cursorStyle,
                  cursorBlinking: settings.cursorBlinking,
                  cursorSmoothCaretAnimation: settings.cursorSmoothCaretAnimation,
                  scrollBeyondLastLine: settings.scrollBeyondLastLine,
                  smoothScrolling: settings.smoothScrolling,
                  multiCursorModifier: settings.multiCursorModifier,
                  bracketPairColorization: { enabled: settings.bracketPairColorization },
                  autoClosingBrackets: settings.autoClosingBrackets,
                  autoClosingQuotes: settings.autoClosingQuotes,
                  formatOnPaste: settings.formatOnPaste,
                  folding: settings.folding,
                  quickSuggestions: settings.quickSuggestions,
                }}
                loading={
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                }
              />
            )}
          </div>
        )}</div>

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
          onMouseEnter={() => { activePaneRef.current = "preview"; }}
          onTouchStart={() => { activePaneRef.current = "preview"; }}
        >
          <div className="hidden md:flex items-center gap-1.5 px-4 py-1.5 text-xs text-muted-foreground border-b border-border bg-muted/50">
            <Eye className="h-3 w-3" />
            Preview
          </div>
          <PreviewPane
            ref={previewRef}
            onScroll={handlePreviewScroll}
            content={previewContent}
            type={docType}
            className={`flex-1 overflow-auto min-h-0 ${docType === "html" ? "p-0" : "p-4"}`}
          />
        </div>
      </div>
    </div>
  );
}
