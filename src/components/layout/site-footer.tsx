import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-grid">
    <section className="footer-intro"><Logo large /><p>Premium movie, TV and subtitle discovery with carefully crafted Sinhala support and rights-aware media access.</p></section>
    <section><h2>Explore</h2><Link href="/movies">Movies</Link><Link href="/tv">TV Series</Link><Link href="/subtitles">Subtitles</Link><Link href="/discover">Discover</Link></section>
    <section><h2>Browse</h2><Link href="/discover?sort=trending">Trending</Link><Link href="/movies?sort=newest">New Releases</Link><Link href="/genres">Genres</Link><Link href="/languages">Languages</Link></section>
    <section><h2>CineSeya.lk</h2><Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/copyright">Copyright</Link><Link href="/takedown">Takedown request</Link></section>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} CineSeya.lk. Discover cinema responsibly.</span><nav><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/accessibility">Accessibility</Link></nav></div></footer>;
}
