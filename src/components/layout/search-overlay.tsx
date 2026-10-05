'use client';

import { ArrowRight, Clock3, Search, TrendingUp, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Suggestion = { type: string; title: string; subtitle: string; slug: string; href?: string; image?: string };
const RECENT_KEY = 'cinerusubs-recent-searches-v1';
const trending = ['Sinhala subtitles', 'Open movies', 'Animation', 'Classic cinema', 'TV episodes'];

function destination(item: Suggestion) {
  if (item.href) return item.href;
  if (item.type === 'movie') return `/movies/${item.slug}`;
  if (item.type === 'series') return `/tv/${item.slug}`;
  if (item.type === 'translator') return `/translator/${item.slug}`;
  return `/movies/${item.slug}#subtitles`;
}

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const recentFrame = requestAnimationFrame(() => setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')));
    const prior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => inputRef.current?.focus());
    const key = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    addEventListener('keydown', key);
    return () => { cancelAnimationFrame(recentFrame); document.body.style.overflow = prior; removeEventListener('keydown', key); };
  }, [open, onClose]);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (response.ok) setItems((await response.json()).items);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 280);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  if (!open) return null;
  const remember = (value: string) => {
    const next = [value, ...recent.filter((entry) => entry !== value)].slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  };

  return <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search CineruSubs">
    <div className="search-dialog">
      <div className="search-dialog-head"><div className="search-field"><Search /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search titles, actors, genres or translators…" aria-label="Search" /><kbd>ESC</kbd></div><button aria-label="Close search" onClick={onClose}><X /></button></div>
      <div className="search-dialog-body">
        {query.trim().length >= 2 ? <>
          <div className="search-state"><span>Results for “{query}”</span>{loading && <i>Searching…</i>}</div>
          <div className="suggestion-list">
            {!loading && items.map((item) => <Link key={`${item.type}-${item.slug}`} href={destination(item)} onClick={() => { remember(query.trim()); onClose(); }}>
              <span className="suggestion-image">{item.image ? <Image src={item.image} alt="" fill sizes="52px" /> : <Search />}</span>
              <span><b>{item.title}</b><small>{item.subtitle}</small></span><em>{item.type}</em><ArrowRight />
            </Link>)}
            {!loading && !items.length && <div className="no-suggestions"><Search /><b>No exact matches</b><p>Try a title, actor, language or translator name.</p><Link href={`/search?q=${encodeURIComponent(query)}`} onClick={() => { remember(query.trim()); onClose(); }}>Search all content</Link></div>}
          </div>
          {items.length > 0 && <Link className="all-results-link" href={`/search?q=${encodeURIComponent(query)}`} onClick={() => { remember(query.trim()); onClose(); }}>View all search results <ArrowRight /></Link>}
        </> : <div className="search-start">
          {recent.length > 0 && <section><div className="search-section-title"><span><Clock3 />Recent searches</span><button onClick={() => { localStorage.removeItem(RECENT_KEY); setRecent([]); }}>Clear</button></div><div className="search-pills">{recent.map((entry) => <button key={entry} onClick={() => setQuery(entry)}>{entry}</button>)}</div></section>}
          <section><div className="search-section-title"><span><TrendingUp />Trending searches</span></div><div className="trending-searches">{trending.map((entry, index) => <button key={entry} onClick={() => setQuery(entry)}><b>{String(index + 1).padStart(2, '0')}</b><span>{entry}</span><ArrowRight /></button>)}</div></section>
          <p className="search-tip"><kbd>↑</kbd><kbd>↓</kbd> navigate <kbd>Enter</kbd> select <kbd>Esc</kbd> close</p>
        </div>}
      </div>
    </div>
  </div>;
}
