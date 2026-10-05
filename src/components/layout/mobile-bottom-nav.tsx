'use client';

import { Bookmark, Compass, Home, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Home', icon: Home }, { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/search', label: 'Search', icon: Search }, { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  return <nav className="mobile-bottom-nav" aria-label="Mobile navigation">{items.map((item) => <Link key={item.href} href={item.href} className={pathname === item.href ? 'active' : ''}><item.icon /><span>{item.label}</span></Link>)}</nav>;
}
