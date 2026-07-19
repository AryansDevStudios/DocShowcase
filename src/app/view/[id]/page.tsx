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

  return {
    title: document.name || "Untitled Document",
    description: `View this ${document.type} document on DocShowcase`,
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

  return (
    <ViewDocumentClient
      documentId={id}
      uihidden={isUiHidden}
      display={displayMode}
      document={{
        name: document.name,
        content: document.content,
        type: document.type,
        passkeyHash: document.passkeyHash,
        updatedAt: document.updatedAt ? document.updatedAt.seconds * 1000 : undefined,
      }}
    />
  );
}
