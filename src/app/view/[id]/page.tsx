import { notFound } from "next/navigation";
import { getDocument } from "@/lib/actions";
import { ViewDocumentClient } from "./view-client";
import type { Metadata } from "next";

interface ViewPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: ViewPageProps): Promise<Metadata> {
  const { id } = await params;
  const document = await getDocument(id);

  if (!document) {
    return { title: "Document Not Found" };
  }

  const title = document.name || "Untitled Document";
  const description = `View this ${document.type} document on DocShowcase`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "DocShowcase",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ViewPage({ params, searchParams }: ViewPageProps) {
  const { id } = await params;
  const { uihidden, display } = await searchParams;
  const isUiHidden = uihidden === "true";
  const displayMode = typeof display === "string" ? display : undefined;

  const document = await getDocument(id);

  if (!document) {
    notFound();
  }

  // Expired documents should not be viewable
  if (document.expiresAt && Date.now() > document.expiresAt.seconds * 1000) {
    notFound();
  }

  return (
    <ViewDocumentClient
      documentId={id}
      display={displayMode}
      document={{
        name: document.name,
        content: document.content,
        type: document.type,
        passkeyHash: document.passkeyHash,
        views: document.views,
        burnAfterReading: document.burnAfterReading || false,
        expiresAt: document.expiresAt ? document.expiresAt.seconds * 1000 : null,
        updatedAt: document.updatedAt ? document.updatedAt.seconds * 1000 : undefined,
      }}
    />
  );
}
