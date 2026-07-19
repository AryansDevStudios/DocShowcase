import { notFound } from "next/navigation";
import { getDocument } from "@/lib/actions";
import { ShareClient } from "./share-client";
import type { Metadata } from "next";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: "Document Saved!",
  description: "Your document has been saved. Share it with anyone!",
};

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  const document = await getDocument(id);

  if (!document) {
    notFound();
  }

  return <ShareClient documentId={id} documentName={document.name} />;
}
