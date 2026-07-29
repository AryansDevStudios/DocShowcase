"use client";

import React from "react";
import { Settings2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditorSettings, EditorSettings } from "@/hooks/use-editor-settings";

export function EditorSettingsDialog() {
  const { settings, updateSetting, resetSettings, isLoaded } = useEditorSettings();

  if (!isLoaded) return null;

  const renderSelect = <K extends keyof EditorSettings>(
    label: string,
    key: K,
    options: { label: string; value: string }[],
    description?: string
  ) => {
    const isDisabled = key !== "engine" && settings.engine === "standard";
    return (
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-border/50 gap-2 ${isDisabled ? "opacity-50 pointer-events-none grayscale" : ""}`}>
        <div className="flex flex-col">
          <span className="text-sm font-medium">{label}</span>
          {description && <span className="text-xs text-muted-foreground">{description}</span>}
        </div>
        <Select
          disabled={isDisabled}
          value={String(settings[key])}
          onValueChange={(val) => {
            let parsedVal: any = val;
            if (val === "true") parsedVal = true;
            if (val === "false") parsedVal = false;
            // specific cases for numbers
            if (key === "fontSize" || key === "lineHeight" || key === "letterSpacing") {
              parsedVal = Number(val);
            }
            updateSetting(key, parsedVal);
          }}
        >
          <SelectTrigger className="w-[180px] h-8 shrink-0 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center justify-center rounded-md border border-input p-1.5 text-xs font-medium text-foreground bg-background hover:bg-muted transition-colors cursor-pointer"
          title="Editor Settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <div className="p-6 pb-2">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <DialogTitle>Editor Settings</DialogTitle>
              <DialogDescription>
                Customize your coding environment. Settings are saved automatically.
              </DialogDescription>
            </div>
            <button 
              onClick={resetSettings}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mr-6"
              title="Reset to defaults"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </DialogHeader>
        </div>

        <Tabs defaultValue="core" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-border">
            <TabsList className="bg-transparent h-auto p-0 gap-4 flex-wrap justify-start">
              <TabsTrigger value="core" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">Engine</TabsTrigger>
              <TabsTrigger value="typography" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">Typography</TabsTrigger>
              <TabsTrigger value="visuals" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">Visuals</TabsTrigger>
              <TabsTrigger value="behavior" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">Behavior</TabsTrigger>
              <TabsTrigger value="coding" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 pb-2">Assistance</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <TabsContent value="core" className="m-0 space-y-1">
              {renderSelect("Editor Engine", "engine", [
                { label: "Monaco Editor (IDE)", value: "monaco" },
                { label: "Standard Textarea", value: "standard" }
              ], "Switch to Standard Textarea on low-end devices.")}
              
              {renderSelect("Editor Theme", "theme", [
                { label: "Match App", value: "match-app" },
                { label: "VS Dark", value: "vs-dark" },
                { label: "VS Light", value: "light" },
                { label: "High Contrast Dark", value: "hc-black" },
                { label: "High Contrast Light", value: "hc-light" },
                { label: "Dark 2026", value: "dark-2026" },
                { label: "Light 2026", value: "light-2026" }
              ], "Forces a specific theme for the Monaco Editor.")}
            </TabsContent>

            <TabsContent value="typography" className="m-0 space-y-1">
              {renderSelect("Font Family", "fontFamily", [
                { label: "Default Monospace", value: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" },
                { label: "Fira Code", value: "'Fira Code', monospace" },
                { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
                { label: "Cascadia Code", value: "'Cascadia Code', monospace" }
              ], "If the font is installed on your device, Monaco will use it.")}
              
              {renderSelect("Font Size", "fontSize", [
                { label: "12px", value: "12" },
                { label: "14px", value: "14" },
                { label: "16px", value: "16" },
                { label: "18px", value: "18" },
                { label: "20px", value: "20" }
              ])}

              {renderSelect("Font Ligatures", "fontLigatures", [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" }
              ], "Requires a font with ligatures (e.g., Fira Code).")}

              {renderSelect("Line Height", "lineHeight", [
                { label: "Tight", value: "1.2" },
                { label: "Default", value: "1.5" },
                { label: "Loose", value: "2" }
              ])}

              {renderSelect("Letter Spacing", "letterSpacing", [
                { label: "Tight", value: "-0.5" },
                { label: "Normal", value: "0" },
                { label: "Wide", value: "0.5" }
              ])}
            </TabsContent>

            <TabsContent value="visuals" className="m-0 space-y-1">
              {renderSelect("Word Wrap", "wordWrap", [
                { label: "Auto (Smart)", value: "auto" },
                { label: "On", value: "on" },
                { label: "Off", value: "off" },
                { label: "Bounded", value: "bounded" }
              ])}

              {renderSelect("Render Whitespace", "renderWhitespace", [
                { label: "None", value: "none" },
                { label: "Boundary", value: "boundary" },
                { label: "Selection", value: "selection" },
                { label: "All", value: "all" }
              ])}

              {renderSelect("Minimap (Outline)", "minimap", [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" }
              ])}

              {renderSelect("Minimap Characters", "minimapRenderCharacters", [
                { label: "Render Real Text", value: "true" },
                { label: "Color Blocks Only", value: "false" }
              ])}

              {renderSelect("Line Numbers", "lineNumbers", [
                { label: "On", value: "on" },
                { label: "Off", value: "off" },
                { label: "Relative", value: "relative" },
                { label: "Interval", value: "interval" }
              ])}

              {renderSelect("Highlight Active Line", "renderLineHighlight", [
                { label: "All", value: "all" },
                { label: "Line", value: "line" },
                { label: "Gutter", value: "gutter" },
                { label: "None", value: "none" }
              ])}
            </TabsContent>

            <TabsContent value="behavior" className="m-0 space-y-1">
              {renderSelect("Cursor Style", "cursorStyle", [
                { label: "Line", value: "line" },
                { label: "Block", value: "block" },
                { label: "Underline", value: "underline" },
                { label: "Line Thin", value: "line-thin" },
                { label: "Block Outline", value: "block-outline" },
                { label: "Underline Thin", value: "underline-thin" }
              ])}

              {renderSelect("Cursor Blinking", "cursorBlinking", [
                { label: "Blink", value: "blink" },
                { label: "Smooth", value: "smooth" },
                { label: "Phase", value: "phase" },
                { label: "Expand", value: "expand" },
                { label: "Solid", value: "solid" }
              ])}

              {renderSelect("Smooth Caret Animation", "cursorSmoothCaretAnimation", [
                { label: "Enabled", value: "on" },
                { label: "Disabled", value: "off" }
              ])}

              {renderSelect("Scroll Beyond Last Line", "scrollBeyondLastLine", [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" }
              ])}

              {renderSelect("Smooth Scrolling", "smoothScrolling", [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" }
              ])}

              {renderSelect("Multi-Cursor Modifier", "multiCursorModifier", [
                { label: "Alt Key", value: "alt" },
                { label: "Ctrl/Cmd Key", value: "ctrlCmd" }
              ])}
            </TabsContent>

            <TabsContent value="coding" className="m-0 space-y-1">
              {renderSelect("Bracket Pair Colorization", "bracketPairColorization", [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" }
              ])}

              {renderSelect("Auto Closing Brackets", "autoClosingBrackets", [
                { label: "Always", value: "always" },
                { label: "Language Defined", value: "languageDefined" },
                { label: "Before Whitespace", value: "beforeWhitespace" },
                { label: "Never", value: "never" }
              ])}

              {renderSelect("Auto Closing Quotes", "autoClosingQuotes", [
                { label: "Always", value: "always" },
                { label: "Language Defined", value: "languageDefined" },
                { label: "Before Whitespace", value: "beforeWhitespace" },
                { label: "Never", value: "never" }
              ])}

              {renderSelect("Format On Paste", "formatOnPaste", [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" }
              ])}

              {renderSelect("Code Folding", "folding", [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" }
              ])}

              {renderSelect("Quick Suggestions", "quickSuggestions", [
                { label: "Enabled", value: "true" },
                { label: "Disabled", value: "false" }
              ])}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
