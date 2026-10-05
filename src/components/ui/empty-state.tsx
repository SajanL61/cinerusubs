import { Film, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="empty-state"><Film /><h1>{title}</h1><p>{children}</p>{action ?? <Link href="/discover"><RotateCcw />Explore all titles</Link>}</section>;
}
