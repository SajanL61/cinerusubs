import type { Metadata } from 'next';
import { WatchlistLibrary } from '@/components/watchlist/watchlist-library';

export const metadata: Metadata = { title: 'Watchlist', robots: { index: false, follow: false } };
export default function WatchlistPage() { return <div className="page-shell"><header className="page-heading"><div><span>Your saved library</span><h1>Watchlist</h1><p>Keep movies and series close. Anonymous saves remain on this device and merge into your account when you sign in.</p></div></header><WatchlistLibrary/></div>; }
