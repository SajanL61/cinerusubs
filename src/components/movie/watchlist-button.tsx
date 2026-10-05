'use client';

import { Bookmark, Check } from 'lucide-react';
import { useSyncExternalStore } from 'react';

const KEY = 'cinerusubs-watchlist-v1';
type LocalItem = { id: string; type: 'movie' | 'series'; slug: string; title: string; posterUrl: string; addedAt: string };

export function WatchlistButton({ id, type = 'movie', slug, title, posterUrl, label = false }: { id: string; type?: 'movie' | 'series'; slug: string; title: string; posterUrl: string; label?: boolean }) {
  const saved = useSyncExternalStore((onChange) => {
    addEventListener('cinerusubs-watchlist-change', onChange);
    addEventListener('storage', onChange);
    return () => { removeEventListener('cinerusubs-watchlist-change', onChange); removeEventListener('storage', onChange); };
  }, () => {
    const items: LocalItem[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    return items.some((item) => item.id === id && item.type === type);
  }, () => false);
  const toggle = () => {
    const items: LocalItem[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    const exists = items.some((item) => item.id === id && item.type === type);
    const next = exists ? items.filter((item) => !(item.id === id && item.type === type)) : [...items, { id, type, slug, title, posterUrl, addedAt: new Date().toISOString() }];
    localStorage.setItem(KEY, JSON.stringify(next));
    dispatchEvent(new CustomEvent('cinerusubs-watchlist-change'));
    if (document.documentElement.dataset.authenticated === 'true') {
      const csrf = decodeURIComponent(document.cookie.split('; ').find((item) => item.startsWith('cinerusubs_csrf='))?.split('=').slice(1).join('=') || '');
      void fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf }, body: JSON.stringify({ contentType: type, contentId: id, action: exists ? 'remove' : 'add' }) });
    }
  };
  return <button className={`watchlist-button ${saved ? 'saved' : ''} ${label ? 'with-label' : ''}`} aria-label={saved ? `Remove ${title} from watchlist` : `Add ${title} to watchlist`} aria-pressed={saved} onClick={(event) => { event.preventDefault(); toggle(); }}>{saved ? <Check /> : <Bookmark />}{label && <span>{saved ? 'In Watchlist' : 'Watchlist'}</span>}</button>;
}
