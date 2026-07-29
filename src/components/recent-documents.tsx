"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentDocuments, type RecentDocument } from "@/lib/recent";
import { FileText, Code, Clock, ArrowRight, BookOpen, PenTool } from "lucide-react";

export function RecentDocuments() {
  const [docs, setDocs] = useState<RecentDocument[]>([]);
  const [activeTab, setActiveTab] = useState<"created" | "viewed">("created");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDocs(getRecentDocuments());
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (docs.length === 0) return null;

  const createdDocs = docs.filter(d => d.actionType === "created");
  const viewedDocs = docs.filter(d => d.actionType === "viewed");

  const displayedDocs = activeTab === "created" ? createdDocs : viewedDocs;

  // Auto-switch tab if one is empty but the other has items
  if (createdDocs.length === 0 && viewedDocs.length > 0 && activeTab === "created") {
    setActiveTab("viewed");
  } else if (viewedDocs.length === 0 && createdDocs.length > 0 && activeTab === "viewed") {
    setActiveTab("created");
  }

  return (
    <section className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Your Documents</h2>
          </div>
          
          <div className="flex items-center p-1 bg-muted/50 rounded-lg border border-border/50 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("created")}
              disabled={createdDocs.length === 0}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "created" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              }`}
            >
              <PenTool className="h-4 w-4" />
              Created
            </button>
            <button
              onClick={() => setActiveTab("viewed")}
              disabled={viewedDocs.length === 0}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === "viewed" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Viewed
            </button>
          </div>
        </div>

        {displayedDocs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
            No {activeTab === "created" ? "created" : "viewed"} documents found.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedDocs.map((doc) => {
              const Icon = doc.type === "html" ? Code : FileText;
              const date = new Date(doc.timestamp).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <Link
                  key={doc.id}
                  href={`/view/${doc.id}`}
                  className="group rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {date}
                    </div>
                  </div>
                  
                  <h3 className="font-semibold mb-1 truncate" title={doc.name}>
                    {doc.name}
                  </h3>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="uppercase tracking-wider font-medium opacity-70">
                      {doc.type}
                    </span>
                    <div className="flex items-center text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transform duration-200">
                      Open <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
