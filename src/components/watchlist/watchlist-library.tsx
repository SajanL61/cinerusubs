'use client';

import { BookmarkX } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useSyncExternalStore } from 'react';

const KEY = 'cinerusubs-watchlist-v1';
type Item = { id: string; type: 'movie' | 'series'; slug: string; title: string; posterUrl: string; addedAt: string };

export function WatchlistLibrary() {
  const raw = useSyncExternalStore((onChange) => {
    addEventListener('cinerusubs-watchlist-change', onChange);
    addEventListener('storage', onChange);
    return () => { removeEventListener('cinerusubs-watchlist-change', onChange); removeEventListener('storage', onChange); };
  }, () => localStorage.getItem(KEY) || '[]', () => '[]');
  const items: Item[] = useMemo(() => JSON.parse(raw), [raw]);
  if (!items.length) return <div className="watchlist-empty"><BookmarkX/><h2>Your watchlist is ready</h2><p>Save a movie or series from any card or title page and it will appear here. Sign in later to sync it across devices.</p><Link className="action-button" href="/discover">Discover titles</Link></div>;
  const remove = (id: string, type: string) => { const next = items.filter((item) => !(item.id === id && item.type === type)); localStorage.setItem(KEY, JSON.stringify(next)); dispatchEvent(new CustomEvent('cinerusubs-watchlist-change')); };
  return <div className="watchlist-grid">{items.map((item) => <article key={`${item.type}-${item.id}`}><Link href={item.type === 'movie' ? `/movies/${item.slug}` : `/tv/${item.slug}`}><span><Image src={item.posterUrl} alt={`${item.title} poster`} fill sizes="180px"/></span><h3>{item.title}</h3><p>{item.type === 'movie' ? 'Movie' : 'TV Series'}</p></Link><button onClick={() => remove(item.id,item.type)}>Remove</button></article>)}</div>;
}
