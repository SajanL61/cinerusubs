'use client';

import { Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function TrailerDialog({ title, url, variant = 'button' }: { title: string; url: string; variant?: 'button' | 'icon' }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const key = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    addEventListener('keydown', key);
    return () => { document.body.style.overflow = prior; removeEventListener('keydown', key); };
  }, [open]);
  return <>
    <button className={variant === 'icon' ? 'trailer-icon' : 'action-button secondary'} onClick={() => setOpen(true)}><Play />{variant === 'button' && 'Watch Trailer'}</button>
    {open && <div className="trailer-backdrop" role="dialog" aria-modal="true" aria-label={`${title} trailer`} onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
      <div className="trailer-dialog"><header><span>{title}</span><button ref={closeRef} aria-label="Close trailer" onClick={() => setOpen(false)}><X /></button></header><div><iframe src={`${url}${url.includes('?') ? '&' : '?'}autoplay=0&rel=0`} title={`${title} trailer`} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div></div>
    </div>}
  </>;
}
