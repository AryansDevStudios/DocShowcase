import { EditorView } from "@/components/editor-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Document",
  description: "Create a new Markdown or HTML document with live preview.",
};

export default function EditorPage() {
  return <EditorView />;
}
