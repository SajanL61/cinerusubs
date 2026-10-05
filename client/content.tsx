import type { ReactNode } from 'react';

export type ContentDocument = {
  key: string;
  title: string;
  body: string;
  status?: 'draft' | 'published';
  updatedAt?: string;
};

/** A deliberately small, safe renderer for owner-managed plain text. */
export function ContentBody({ body }: { body: string }) {
  const lines = body.replaceAll('\r\n', '\n').split('\n');
  const blocks: ReactNode[] = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex]!.trim();
    if (!line) {
      lineIndex += 1;
      continue;
    }
    if (line.startsWith('> ')) {
      blocks.push(<aside className="content-callout" key={`callout-${lineIndex}`}>{line.slice(2)}</aside>);
      lineIndex += 1;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push(<h3 key={`h3-${lineIndex}`}>{line.slice(4)}</h3>);
      lineIndex += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={`h2-${lineIndex}`}>{line.slice(3)}</h2>);
      lineIndex += 1;
      continue;
    }
    if (line.startsWith('- ')) {
      const items: ReactNode[] = [];
      const listStart = lineIndex;
      while (lineIndex < lines.length && lines[lineIndex]!.trim().startsWith('- ')) {
        items.push(<li key={`item-${lineIndex}`}>{lines[lineIndex]!.trim().slice(2)}</li>);
        lineIndex += 1;
      }
      blocks.push(<ul key={`list-${listStart}`}>{items}</ul>);
      continue;
    }
    blocks.push(<p key={`p-${lineIndex}`}>{line}</p>);
    lineIndex += 1;
  }

  return <div className="content-body">{blocks}</div>;
}
