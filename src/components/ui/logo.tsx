import Link from 'next/link';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-logo" href="/" aria-label="CineruSubs home">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
      {!compact && <span className="brand-name"><b>Cineru</b><em>Subs</em></span>}
    </Link>
  );
}
