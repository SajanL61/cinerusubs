import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { currentUser } from '@/lib/auth';
import { WatchlistSync } from '@/components/watchlist/watchlist-sync';

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  return <><WatchlistSync authenticated={Boolean(user)}/><SiteHeader user={user} /><main className="site-main">{children}</main><SiteFooter /><MobileBottomNav /></>;
}
