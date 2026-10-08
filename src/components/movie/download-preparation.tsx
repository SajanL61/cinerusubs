'use client';

import { CheckCircle2, Download, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DownloadMirrorDto } from '@/types/media';

export function DownloadPreparation({ mediaVersionId, directAvailable, mirrors }: { mediaVersionId: string; directAvailable: boolean; mirrors: DownloadMirrorDto[] }) {
  const [countdown, setCountdown] = useState(3);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function prepare() {
    if (!directAvailable) return;
    setPending(true); setError(''); setDownloadUrl('');
    try { const response = await fetch(`/api/download/${mediaVersionId}`, { cache: 'no-store' }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message || 'Direct download is temporarily unavailable.'); setDownloadUrl(result.downloadUrl); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Direct download is temporarily unavailable.'); }
    finally { setPending(false); }
  }

  useEffect(() => {
    if (!directAvailable) return;
    if (countdown <= 0) { const timer = window.setTimeout(() => void prepare(), 0); return () => window.clearTimeout(timer); }
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1_000);
    return () => window.clearTimeout(timer);
  // prepare intentionally runs once when the countdown reaches zero.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown, directAvailable]);

  return <div className="download-preparation">
    <div className="download-security-status"><ShieldCheck/><span><b>Secure delivery</b><small>Short-lived authorization · permanent storage URLs stay private</small></span></div>
    {directAvailable && countdown > 0 && <div className="download-countdown"><span>Preparing secure download…</span><b>{countdown}</b><small>Checking rights, availability and rate limits</small></div>}
    {pending && <div className="download-preparing"><LoaderCircle className="spin"/><span>Generating your protected link…</span></div>}
    {downloadUrl && <a className="download-start" href={downloadUrl}><Download/>Start Download</a>}
    {error && <div className="download-prepare-error"><p>{error}</p><button type="button" onClick={prepare}><RefreshCw/>Try again</button></div>}
    {!directAvailable && <div className="download-prepare-error"><p>Direct download is temporarily unavailable. Choose an active alternative source below.</p></div>}
    {mirrors.length > 0 && <section className="download-alternatives"><h2>Alternative sources</h2>{mirrors.map((mirror) => <a href={mirror.redirectPath} key={mirror.id}><span><b>{mirror.providerName}</b><small>{mirror.supportsResume ? 'Resume supported' : mirror.providerType.replace('_', ' ')}</small></span><em>{mirror.healthStatus === 'online' ? '● Online' : mirror.healthStatus === 'unavailable' ? '○ Unavailable' : '○ Not checked'}</em></a>)}</section>}
    <p className="download-trust"><CheckCircle2/>No popups, fake virus warnings, or multi-step verification.</p>
  </div>;
}
