'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, Copy, Share2, FileCheck, FilePlus, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function SharePage() {
  const params = useParams();
  const { toast } = useToast();
  const [documentUrl, setDocumentUrl] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && params.id) {
      setDocumentUrl(`${window.location.origin}/view/${params.id}`);
    }
  }, [params.id]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(documentUrl);
      setIsCopied(true);
      toast({
        title: 'Copied!',
        description: 'URL copied to clipboard.',
      });
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy URL.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this document',
          text: 'I created this document, take a look!',
          url: documentUrl,
        });
      } catch (error) {
        // Handle web share API errors (e.g., user cancels share)
        console.error('Error sharing:', error);
      }
    } else {
      toast({
        title: 'Not Supported',
        description: 'Web Share API is not supported in your browser.',
        variant: 'destructive',
      });
    }
  };

  if (!params.id) {
    return null; // Or a loading/error state
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit">
            <FileCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="mt-4">Document Saved Successfully!</CardTitle>
          <CardDescription>
            Your document is now saved and ready to be shared.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input value={documentUrl} readOnly />
            <Button variant="outline" size="icon" onClick={handleCopyToClipboard}>
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              <span className="sr-only">Copy URL</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button onClick={handleShare} className="w-full">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="secondary" asChild className="w-full">
                <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View
                </a>
            </Button>
            <Button variant="outline" asChild className="w-full sm:col-span-1">
              <Link href="/editor">
                <FilePlus className="mr-2 h-4 w-4" />
                New Document
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
