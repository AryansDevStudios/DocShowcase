"use client";

import { useState } from "react";
import { 
  Trash2, 
  Eye, 
  Search, 
  FileText, 
  Code, 
  LogOut,
  Shield,
  Hourglass,
  Clock,
  Loader2,
  X,
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import { adminDeleteDocument, adminLogout, adminGetFullDocument } from "@/lib/actions";
import { PreviewPane } from "@/components/preview-pane";

interface AdminDocument {
  id: string;
  name: string;
  type: string;
  views: number;
  burnAfterReading: boolean;
  expiresAt: number | null;
  createdAt: number | null;
  contentPreview: string;
  isEncrypted: boolean;
}

export function AdminDashboardClient({ initialDocuments }: { initialDocuments: AdminDocument[] }) {
  const [documents, setDocuments] = useState<AdminDocument[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // For Preview Modal
  const [previewDoc, setPreviewDoc] = useState<AdminDocument | null>(null);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.id.toLowerCase().includes(search.toLowerCase())
  );

  const confirmDelete = (id: string) => {
    setConfirmDeleteId(id);
    setDeleteError(null);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    
    setDeletingId(id);
    setDeleteError(null);
    const res = await adminDeleteDocument(id);
    if (res.success) {
      setDocuments(docs => docs.filter(d => d.id !== id));
      setConfirmDeleteId(null);
    } else {
      setDeleteError(res.error || "Failed to delete document");
    }
    setDeletingId(null);
  };

  const handleLogout = async () => {
    await adminLogout();
    window.location.reload();
  };

  const openPreview = async (doc: AdminDocument) => {
    setPreviewDoc(doc);
    setLoadingContent(true);
    try {
      const res = await adminGetFullDocument(doc.id);
      if (res.success && res.content !== undefined) {
        setFullContent(res.content);
      } else {
        setFullContent(res.error || "Failed to load full content. Document might be deleted or expired.");
      }
    } catch {
      setFullContent("Network error loading content.");
    } finally {
      setLoadingContent(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Admin Dashboard</h1>
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {documents.length} Docs
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
              {/* Card Header */}
              <div className="flex items-start justify-between p-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                    {doc.type === "markdown" ? <FileText className="h-5 w-5 text-blue-500" /> : <Code className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate" title={doc.name || "Untitled"}>
                      {doc.name || <span className="text-muted-foreground italic">Untitled Document</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono truncate">{doc.id}</p>
                  </div>
                </div>
              </div>
              
              {/* Content Preview */}
              <div className="p-4 flex-1">
                <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 h-20 overflow-hidden relative">
                  {doc.isEncrypted ? (
                    <div className="flex items-center gap-2 h-full justify-center text-emerald-600 dark:text-emerald-400">
                      <Shield className="h-4 w-4" />
                      <span className="font-medium">Encrypted Payload</span>
                    </div>
                  ) : (
                    <p className="line-clamp-3 font-mono text-[11px] leading-relaxed opacity-70">
                      {doc.contentPreview || "No content"}
                    </p>
                  )}
                  {/* Fade out bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
                </div>
              </div>
              
              {/* Meta & Actions */}
              <div className="px-4 py-3 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1" title="Views">
                    <Eye className="h-3.5 w-3.5" /> {doc.views}
                  </span>
                  <span className="flex items-center gap-1" title="Created">
                    <Clock className="h-3.5 w-3.5" /> 
                    {doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : "N/A"}
                  </span>
                  {doc.burnAfterReading && (
                    <span className="flex items-center gap-1 text-orange-500" title="Burn After Reading">
                      <Hourglass className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <a 
                    href={`/view/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
                    title="Open View Page"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button 
                    onClick={() => openPreview(doc)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
                    title="Preview Document"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => confirmDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                    title="Delete Document"
                  >
                    {deletingId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredDocs.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-6 w-6" />
              </div>
              <p>No documents found.</p>
            </div>
          )}
        </div>
      </main>

      {/* Full Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-5xl h-[90vh] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{previewDoc.name || previewDoc.id}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{previewDoc.type}</span>
              </div>
              <button 
                onClick={() => { setPreviewDoc(null); setFullContent(null); }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-hidden relative bg-background">
              {loadingContent ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm">Loading full content...</p>
                </div>
              ) : previewDoc.isEncrypted ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground px-6 text-center">
                  <Shield className="h-12 w-12 text-emerald-500 mb-2" />
                  <h3 className="text-lg font-semibold text-foreground">End-to-End Encrypted</h3>
                  <p className="max-w-md">This document is secured with a View Password. The content cannot be viewed from the admin dashboard.</p>
                  <pre className="mt-4 p-4 rounded-xl bg-muted text-[10px] font-mono break-all w-full max-w-2xl overflow-auto max-h-40">
                    {fullContent}
                  </pre>
                </div>
              ) : fullContent ? (
                <PreviewPane 
                  content={fullContent} 
                  type={previewDoc.type as any} 
                  className="h-full w-full"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl p-6 animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold">Delete Document?</h2>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. The document will be permanently removed from the database.
              </p>
              
              {deleteError && (
                <div className="w-full mt-2 p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20 font-medium">
                  {deleteError}
                </div>
              )}
              
              <div className="flex w-full gap-3 mt-4">
                <button
                  onClick={() => {
                    setConfirmDeleteId(null);
                    setDeleteError(null);
                  }}
                  disabled={deletingId !== null}
                  className="flex-1 rounded-lg px-4 py-2 font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  disabled={deletingId !== null}
                  className="flex-1 rounded-lg px-4 py-2 font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {deletingId ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
