"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorView } from "@/components/editor-view";
import type { DocumentData } from "@/lib/types";
import { Loader2, ShieldAlert, Lock } from "lucide-react";
import Link from "next/link";

interface EditDocumentClientProps {
  documentId: string;
  document: {
    name: string;
    content: string;
    type: "markdown" | "html";
    passkeyHash: string | null;
  };
}

export function EditDocumentClient({
  documentId,
  document,
}: EditDocumentClientProps) {
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [passkey, setPasskey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for session token in sessionStorage
    const token = sessionStorage.getItem(`edit-token-${documentId}`);
    if (token) {
      setAuthorized(true);
    }
    setChecking(false);
  }, [documentId]);

  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Verifying authorization…
        </p>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey.trim()) {
      setError("Please enter a passkey.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-passkey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documentId, passkey }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem(`edit-token-${documentId}`, data.token);
        setAuthorized(true);
      } else {
        setError(data.error || "Verification failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl mx-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-card-foreground">
                Edit Document
              </h2>
              <p className="text-sm text-muted-foreground">
                Enter the passkey to edit this document
              </p>
            </div>
          </div>
          
          <form onSubmit={handleVerify}>
            <input
              type="password"
              value={passkey}
              onChange={(e) => {
                setPasskey(e.target.value);
                setError("");
              }}
              placeholder="Enter passkey"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
              disabled={loading}
            />

            {error && (
              <p className="mt-2 text-sm text-destructive">{error}</p>
            )}

            <div className="mt-6 flex gap-2 justify-end">
              <Link
                href={`/view/${documentId}`}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !passkey.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Verifying…" : "Verify & Edit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const initialDoc: DocumentData = {
    name: document.name,
    content: document.content,
    type: document.type,
    passkeyHash: null,
  };

  return (
    <EditorView
      documentId={documentId}
      initialDocument={initialDoc}
      isEditing
    />
  );
}
