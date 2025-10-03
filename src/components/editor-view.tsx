'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { DocumentData, DocType } from '@/app/actions';
import { saveDocument } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader, Save, Code, FileText, Eye, Pencil, ExternalLink, Sigma } from 'lucide-react';
import PreviewPane from './preview-pane';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from './theme-toggle';

const LOCAL_STORAGE_KEY = 'docshowcase_unsaved_document';
const MAX_CONTENT_BYTES = 1024 * 1024; // 1MB

export default function EditorView({ documentId, initialDocument }: { documentId?: string; initialDocument?: DocumentData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState<DocType>('markdown');
  const [currentId, setCurrentId] = useState<string | null>(documentId || null);

  // Load from localStorage on initial render
  useEffect(() => {
    if (!initialDocument) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const data = JSON.parse(saved);
          setName(data.name || '');
          setContent(data.content || '');
          setDocType(data.docType || 'markdown');
        }
      } catch (error) {
        console.error("Failed to parse from localStorage", error);
      }
    }
  }, [initialDocument]);

  useEffect(() => {
    if (documentId) {
      setCurrentId(documentId);
    }
    if(initialDocument) {
      setName(initialDocument.name || '');
      setContent(initialDocument.content);
      setDocType(initialDocument.type || 'markdown');
    }
  }, [documentId, initialDocument]);

  // Save to localStorage on change
  useEffect(() => {
    // Only save if it's a new document (no initialDocument)
    if (!initialDocument) {
      try {
        const data = JSON.stringify({ name, content, docType });
        localStorage.setItem(LOCAL_STORAGE_KEY, data);
      } catch (error) {
        console.error("Failed to save to localStorage", error);
      }
    }
  }, [name, content, docType, initialDocument]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const sizeInBytes = new TextEncoder().encode(newContent).length;

    if (sizeInBytes > MAX_CONTENT_BYTES) {
        toast({
            title: "Content Limit Exceeded",
            description: `Your document cannot be larger than ${MAX_CONTENT_BYTES / (1024 * 1024)}MB.`,
            variant: "destructive",
        });
    } else {
        setContent(newContent);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveDocument(currentId, name, content, docType);
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result.id) {
        // Clear localStorage on successful save
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
            console.error("Failed to clear localStorage", error);
        }
        router.push(`/share/${result.id}`);
      }
    });
  };
  

  return (
    <div className="flex flex-col h-dvh bg-background">
      <header className="flex items-center justify-between p-2 border-b shrink-0 gap-2">
        <Link href="/" className="flex items-center gap-4">
          <FileText className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold font-headline hidden sm:block">DocShowcase</h1>
        </Link>
        <div className="flex-1 max-w-md">
            <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Document Name (optional)" 
                className="w-full"
            />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
            <SelectTrigger className="w-[50px] sm:w-[150px]">
                <div className="sm:hidden">
                    {docType === 'markdown' && <FileText className="h-4 w-4" />}
                    {docType === 'html' && <Code className="h-4 w-4" />}
                </div>
                 <div className="hidden sm:block">
                    <SelectValue placeholder="Select type" />
                </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="markdown"><FileText className="inline-block mr-2 h-4 w-4" />Markdown</SelectItem>
              <SelectItem value="html"><Code className="inline-block mr-2 h-4 w-4" />HTML</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={isPending || !content.trim()}>
            {isPending ? <Loader className="animate-spin" /> : <Save />}
            <span className="ml-2 hidden sm:inline">Save & Share</span>
          </Button>
           {currentId && (
            <Button variant="ghost" size="icon" asChild>
              <a href={`/view/${currentId}`} target="_blank" rel="noopener noreferrer" aria-label="Open view in new tab">
                <ExternalLink />
              </a>
            </Button>
           )}
        </div>
      </header>

      <main className="flex-grow md:grid md:grid-cols-2 gap-4 p-4 overflow-hidden hidden">
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Pencil />Editor</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col">
            <Textarea
              value={content}
              onChange={handleContentChange}
              placeholder={`Write some ${docType}...`}
              className="w-full h-full flex-grow resize-none font-code text-base"
            />
          </CardContent>
        </Card>
        <Card className="flex flex-col h-full overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Eye/>Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow overflow-y-auto">
            <PreviewPane content={content} type={docType} />
          </CardContent>
        </Card>
      </main>

      <main className="flex flex-col flex-grow p-4 md:hidden min-h-0">
  <Tabs defaultValue="editor" className="flex flex-col flex-grow min-h-0">
    <TabsList className="w-full shrink-0">
      <TabsTrigger value="editor" className="w-full flex items-center gap-2"><Pencil /> Editor</TabsTrigger>
      <TabsTrigger value="preview" className="w-full flex items-center gap-2"><Eye /> Preview</TabsTrigger>
    </TabsList>

    <TabsContent value="editor" className="flex flex-col flex-grow min-h-0 mt-4 overflow-y-auto">
      <Textarea
        value={content}
        onChange={handleContentChange}
        className="w-full flex-grow resize-none font-code text-base"
      />
    </TabsContent>

    <TabsContent value="preview" className="flex flex-col flex-grow min-h-0 mt-4 overflow-y-auto">
      <PreviewPane content={content} type={docType} />
    </TabsContent>
  </Tabs>
</main>

    </div>
  );
}
