import Link from "next/link";
import {
  FileText,
  Code,
  Eye,
  Share2,
  Lock,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--primary)_0%,_transparent_50%)] opacity-[0.07]" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary animate-fade-in">
              <Zap className="h-3 w-3" />
              No account needed
            </div>

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl animate-slide-up">
              Share Documents{" "}
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Instantly
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-lg text-muted-foreground animate-slide-up sm:text-xl">
              Write in Markdown or HTML with live preview and LaTeX math support.
              Save, get a link, share. That simple.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-slide-up">
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Start Creating
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-5xl px-4 py-16">
          <h2 className="text-center text-2xl font-bold mb-10">
            Everything you need to share content
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: "Markdown Editor",
                description:
                  "Full GitHub-flavored Markdown with live preview. Tables, code blocks, task lists — all supported.",
              },
              {
                icon: Code,
                title: "HTML Support",
                description:
                  "Write raw HTML and see it rendered in a sandboxed preview. Perfect for quick web pages.",
              },
              {
                icon: Eye,
                title: "Live Preview",
                description:
                  "Side-by-side editor and preview on desktop. Tabbed interface on mobile. See changes instantly.",
              },
              {
                icon: Share2,
                title: "Instant Sharing",
                description:
                  "Save your document and get a clean, shareable URL. Copy, share via native share, or open in a new tab.",
              },
              {
                icon: Lock,
                title: "Passkey Protection",
                description:
                  "Set an optional passkey when creating. Only those with the passkey can edit. No passkey = read-only forever.",
              },
              {
                icon: Zap,
                title: "LaTeX Math",
                description:
                  "Write inline $math$ or block $$equations$$. Powered by KaTeX for fast, beautiful rendering.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to share?</h2>
          <p className="text-muted-foreground mb-6">
            No sign up. No setup. Just write and share.
          </p>
          <Link
            href="/editor"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/30"
          >
            Open Editor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
