import Image from 'next/image';
import Link from 'next/link';

export function Logo({ compact = false, large = false }: { compact?: boolean; large?: boolean }) {
  return (
    <Link className={`brand-logo${compact ? ' brand-logo-compact' : ''}`} href="/" aria-label="CineSeya.lk home">
      <Image
        className="brand-image"
        src="/brand/cineseya-wordmark.png"
        alt=""
        width={2172}
        height={724}
        sizes={compact ? '48px' : large ? '(max-width: 600px) calc(100vw - 44px), 320px' : '(max-width: 700px) 124px, (max-width: 1280px) 138px, 166px'}
        loading="eager"
      />
    </Link>
  );
}
