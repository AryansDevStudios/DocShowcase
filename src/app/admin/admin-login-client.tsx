"use client";

import { useState } from "react";
import { Lock, Loader2, ShieldAlert } from "lucide-react";
import { checkAdminPassword } from "@/lib/actions";

export function AdminLoginClient({ onLogin }: { onLogin: (password: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the admin password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const isValid = await checkAdminPassword(password);
      if (isValid) {
        onLogin(password);
      } else {
        setError("Invalid master password.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl relative overflow-hidden">
        {/* Aesthetic background accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500" />
        
        <div className="flex flex-col items-center text-center gap-3 mb-8 mt-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
            Admin Access
          </h1>
          <p className="text-sm text-muted-foreground px-4">
            This area is strictly restricted. Please enter the master password to continue.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter master password"
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center font-medium animate-in slide-in-from-top-1">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer shadow-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Authenticate"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
