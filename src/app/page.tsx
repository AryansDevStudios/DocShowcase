'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Code, Sigma, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme-toggle';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
    const markdownImage = PlaceHolderImages.find(img => img.id === 'homepage-markdown');
    const htmlImage = PlaceHolderImages.find(img => img.id === 'homepage-html');
    const latexImage = PlaceHolderImages.find(img => img.id === 'homepage-latex');

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link href="#" className="flex items-center justify-center" prefetch={false}>
          <FileText className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-semibold font-headline">DocShowcase</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 sm:gap-6">
          <Button asChild>
            <Link href="/editor">Get Started <ArrowRight className="ml-2" /></Link>
          </Button>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-1 lg:gap-12 justify-items-center">
                <div className="flex flex-col justify-center space-y-4 text-center">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                      Create, Render, and Share Your Documents
                    </h1>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl">
                      DocShowcase is the ultimate tool for developers, writers, and academics to seamlessly work with Markdown, HTML, and LaTeX.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center">
                    <Button asChild size="lg">
                      <Link href="/editor">
                        Start Creating
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                       <Link href="#features">
                        Learn More
                      </Link>
                    </Button>
                  </div>
                </div>
            </div>
          </div>
        </section>
        
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted-foreground/10 px-3 py-1 text-sm">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">One Tool, Multiple Formats</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our editor provides a seamless experience for writing in your favorite formats, with a live preview to see your changes instantly.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-stretch gap-6 py-12 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                    {markdownImage && 
                        <Image src={markdownImage.imageUrl} alt={markdownImage.description} width={600} height={400} className="rounded-t-lg aspect-[16/9] object-cover" data-ai-hint={markdownImage.imageHint} />
                    }
                </CardHeader>
                <CardContent className="p-6">
                    <CardTitle className="flex items-center gap-2 mb-2"><FileText className="text-primary"/>Markdown</CardTitle>
                    <p className="text-muted-foreground">Write using simple, intuitive Markdown syntax for clean and readable content. Ideal for documentation and notes.</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                    {htmlImage && 
                        <Image src={htmlImage.imageUrl} alt={htmlImage.description} width={600} height={400} className="rounded-t-lg aspect-[16/9] object-cover" data-ai-hint={htmlImage.imageHint}/>
                    }
                </CardHeader>
                <CardContent className="p-6">
                    <CardTitle className="flex items-center gap-2 mb-2"><Code className="text-primary"/>HTML</CardTitle>
                    <p className="text-muted-foreground">Embed custom HTML for complete control over the structure and style of your output. Create rich web content with ease.</p>
                </CardContent>
              </Card>
               <Card>
                <CardHeader>
                    {latexImage && 
                        <Image src={latexImage.imageUrl} alt={latexImage.description} width={600} height={400} className="rounded-t-lg aspect-[16/9] object-cover" data-ai-hint={latexImage.imageHint}/>
                    }
                </CardHeader>
                <CardContent className="p-6">
                    <CardTitle className="flex items-center gap-2 mb-2"><Sigma className="text-primary"/>LaTeX</CardTitle>
                    <p className="text-muted-foreground">Seamlessly render beautiful and complex mathematical formulas and equations for academic and scientific papers.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Ready to Get Started?</h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Stop juggling multiple tools. Start creating, rendering, and sharing your documents from one unified platform.
                </p>
                </div>
                <div className="flex justify-center">
                    <Button asChild size="lg">
                        <Link href="/editor">
                            Create Your First Document
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>
    </div>
  );
}
