import { notFound, redirect } from "next/navigation";
import { getDocument } from "@/lib/actions";
import { EditDocumentClient } from "./edit-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Document",
};

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id } = await params;

  const document = await getDocument(id);

  if (!document) {
    notFound();
  }

  // If no passkey hash, document is read-only — redirect to view
  if (!document.passkeyHash) {
    redirect(`/view/${id}`);
  }

  return (
    <EditDocumentClient
      documentId={id}
      document={{
        name: document.name,
        content: document.content,
        type: document.type,
        passkeyHash: document.passkeyHash,
      }}
    />
  );
}
