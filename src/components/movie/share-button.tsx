'use client';

import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (navigator.share) await navigator.share({ title, url: location.href });
    else { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); }
  };
  return <button className="detail-secondary-action" onClick={share}>{copied ? <Check/> : <Share2/>}{copied ? 'Copied' : 'Share'}</button>;
}
