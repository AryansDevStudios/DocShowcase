'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Latex from 'react-latex-next';
import type { DocType } from '@/app/actions';

const renderers = {
  p: (paragraph: { children?: React.ReactNode, node?: any }) => {
    const { node } = paragraph;

    // Check if the paragraph contains a single text node that is a latex block
    if (node.children.length === 1 &&
        node.children[0].type === 'text' &&
        /^\$\$[\s\S]*\$\$$/.test(node.children[0].value)) {
      return <Latex>{node.children[0].value}</Latex>;
    }
    
    // Check if the paragraph contains an inline code element that is a latex block
    if (node.children.length === 1 &&
        node.children[0].tagName === 'code' &&
        node.children[0].children.length > 0 &&
        /^\$\$[\s\S]*\$\$$/.test(node.children[0].children[0].value)) {
        return <Latex>{node.children[0].children[0].value}</Latex>
    }
    
    // This is to prevent <pre> being a descendant of <p>
    // which causes a hydration error.
    if (node.children.length === 1 && node.children[0].tagName === "code") {
      const child = node.children[0];
      const childString = child.children[0]?.value || '';
      // If it's a block code (not inline and not latex)
      if (child.tagName === 'code' && !/^\$[\s\S]*\$$/.test(childString)) {
         return paragraph.children;
      }
    }


    // Otherwise, render as a normal paragraph
    return <p>{paragraph.children}</p>;
  },
  code: (props: { inline?: boolean, children: React.ReactNode, className?: string, node?: any }) => {
    const { inline, children, className } = props;
    const childString = String(children);

    if (inline) {
        // This is for inline latex like $...$
        if (childString.startsWith('$') && childString.endsWith('$')) {
            return <Latex>{childString}</Latex>;
        }
        return <code className={className}>{children}</code>;
    }
    
    // This is for block latex in code blocks like $$...$$
    if (/^\$\$[\s\S]*\$\$$/.test(childString)) {
      // We return null here because the 'p' renderer will handle it.
      return null;
    }

    // This handles code blocks from markdown that aren't latex
    return <pre><code className={className}>{children}</code></pre>;
  }
};


export default function PreviewPane({ content, type }: { content: string; type: DocType }) {
  return (
    <div className="preview-content h-full">
      {type === 'markdown' && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={renderers}
        >
          {content}
        </ReactMarkdown>
      )}
      {type === 'html' && (
        <iframe
          srcDoc={content}
          title="HTML Preview"
          sandbox="allow-scripts allow-modals"
          className="w-full h-full border-0"
        />
      )}
    </div>
  );
}
