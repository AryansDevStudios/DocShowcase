import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import EditorView from '@/components/editor-view';
import type { DocumentData } from '@/app/actions';
import { notFound, redirect } from 'next/navigation';

async function getDocument(id: string): Promise<DocumentData | null> {
  try {
    const docRef = doc(db, 'documents', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as DocumentData;
      // Convert Timestamps to serializable format (ISO string)
      return {
        ...data,
        createdAt: data.createdAt?.toDate().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString(),
      } as unknown as DocumentData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return null;
  }
}

export default async function DocumentPage({ params }: { params: { id: string } }) {
  // Redirect to the new editor path for specific documents
  if (params.id) {
    redirect(`/editor/${params.id}`);
  }

  const document = await getDocument(params.id);

  if (!document) {
    notFound();
  }

  return <EditorView documentId={params.id} initialDocument={document} />;
}
