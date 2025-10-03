import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import PreviewPane from '@/components/preview-pane';
import type { DocumentData } from '@/app/actions';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

async function getDocument(id: string): Promise<DocumentData | null> {
  try {
    const docRef = doc(db, 'documents', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as DocumentData;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    return null;
  }
}

function getTimeAgo(timestamp: any): string {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
    }
    return 'a while ago';
}

export default async function ViewPage({ params }: { params: { id: string } }) {
  const document = await getDocument(params.id);

  if (!document) {
    notFound();
  }
  
  if (document.type === 'html') {
    return (
        <div className="w-full h-screen border-0 flex flex-col">
            <iframe 
                srcDoc={document.content}
                title={document.name || 'HTML Document'}
                className="flex-grow w-full border-0"
                sandbox="allow-scripts allow-modals"
            />
        </div>
    );
  }

  const updatedAt = getTimeAgo(document.updatedAt);
  const title = document.name || 'Rendered Content';

  return (
    <>
      <div className="min-h-screen bg-background p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-4xl">
          <div className="mb-4 flex justify-start items-center">
              <Button variant="outline" asChild>
                  <Link href="/">
                      <Home />
                      Home
                  </Link>
              </Button>
          </div>
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="font-headline">{title}</CardTitle>
                  <CardDescription>Last updated {updatedAt}</CardDescription>
                </div>
                <Badge variant="secondary" className="capitalize">{document.type}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <PreviewPane content={document.content} type={document.type} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
