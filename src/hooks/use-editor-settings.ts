import { useState, useEffect } from "react";

export type EditorEngine = "monaco" | "standard";
export type EditorTheme = "match-app" | "vs-dark" | "light" | "hc-black" | "hc-light" | "dark-2026" | "light-2026";
export type WordWrap = "auto" | "on" | "off" | "wordWrapColumn" | "bounded";
export type RenderWhitespace = "none" | "boundary" | "selection" | "all";
export type LineNumbers = "on" | "off" | "relative" | "interval";
export type RenderLineHighlight = "all" | "line" | "none" | "gutter";
export type CursorStyle = "line" | "block" | "underline" | "line-thin" | "block-outline" | "underline-thin";
export type CursorBlinking = "blink" | "smooth" | "phase" | "expand" | "solid";
export type AutoClosing = "always" | "languageDefined" | "beforeWhitespace" | "never";

export interface EditorSettings {
  // Core & Engine
  engine: EditorEngine;
  theme: EditorTheme;
  
  // Typography
  fontFamily: string;
  fontSize: number;
  fontLigatures: boolean;
  lineHeight: number;
  letterSpacing: number;

  // Visuals & Rendering
  wordWrap: WordWrap;
  renderWhitespace: RenderWhitespace;
  minimap: boolean;
  minimapRenderCharacters: boolean;
  lineNumbers: LineNumbers;
  renderLineHighlight: RenderLineHighlight;

  // Cursor & Behavior
  cursorStyle: CursorStyle;
  cursorBlinking: CursorBlinking;
  cursorSmoothCaretAnimation: "on" | "off";
  scrollBeyondLastLine: boolean;
  smoothScrolling: boolean;
  multiCursorModifier: "alt" | "ctrlCmd";

  // Coding Assistance
  bracketPairColorization: boolean;
  autoClosingBrackets: AutoClosing;
  autoClosingQuotes: AutoClosing;
  formatOnPaste: boolean;
  folding: boolean;
  quickSuggestions: boolean;
}

export const defaultSettings: EditorSettings = {
  engine: "monaco",
  theme: "match-app",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 14,
  fontLigatures: false,
  lineHeight: 1.5,
  letterSpacing: 0,
  wordWrap: "auto",
  renderWhitespace: "none",
  minimap: false,
  minimapRenderCharacters: false,
  lineNumbers: "on",
  renderLineHighlight: "line",
  cursorStyle: "line",
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  scrollBeyondLastLine: false,
  smoothScrolling: true,
  multiCursorModifier: "alt",
  bracketPairColorization: true,
  autoClosingBrackets: "languageDefined",
  autoClosingQuotes: "languageDefined",
  formatOnPaste: true,
  folding: true,
  quickSuggestions: true,
};

export function useEditorSettings() {
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem("docshowcase-editor-settings");
      if (saved) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(saved) });
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
      setIsLoaded(true);
    };

    loadSettings();

    window.addEventListener("docshowcase-settings-updated", loadSettings);
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "docshowcase-editor-settings") {
        loadSettings();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("docshowcase-settings-updated", loadSettings);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem("docshowcase-editor-settings", JSON.stringify(next));
      window.dispatchEvent(new Event("docshowcase-settings-updated"));
      return next;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem("docshowcase-editor-settings", JSON.stringify(defaultSettings));
    window.dispatchEvent(new Event("docshowcase-settings-updated"));
  };

  return { settings, updateSetting, resetSettings, isLoaded };
}
