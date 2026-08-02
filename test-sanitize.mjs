import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';

const markdown = `
> [!NOTE]
> This is a note.
`;

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkGithubAlerts)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, {
    ...defaultSchema,
    tagNames: [...(defaultSchema.tagNames || []), 'svg', 'path'],
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'dir', 'class'],
      svg: ['viewBox', 'version', 'width', 'height', 'aria-hidden', 'data-component'],
      path: ['d', 'fill-rule', 'clip-rule', 'fill']
    }
  })
  .use(rehypeStringify);

const result = await processor.process(markdown);
console.log("OUTPUT:");
console.log(String(result));
