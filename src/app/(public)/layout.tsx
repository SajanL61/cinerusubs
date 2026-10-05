import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <><SiteHeader /><main className="site-main">{children}</main><SiteFooter /><MobileBottomNav /></>;
}
