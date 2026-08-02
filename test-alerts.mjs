import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';
import html from 'remark-html';

const markdown = `
> [!NOTE]
> This is a note.
`;

const processor = remark()
  .use(remarkGfm)
  .use(remarkGithubAlerts)
  .use(html);

const result = await processor.process(markdown);
console.log(String(result));
