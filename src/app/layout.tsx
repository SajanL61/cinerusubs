import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { PwaRegister } from '@/components/pwa/pwa-register';
import { siteUrl } from '@/lib/env';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'CineruSubs — Movies, TV & Sinhala Subtitles', template: '%s | CineruSubs' },
  description: 'Discover movies, TV series and carefully verified Sinhala and English subtitles with CineruSubs.',
  applicationName: 'CineruSubs',
  category: 'entertainment',
  openGraph: { type: 'website', siteName: 'CineruSubs', title: 'CineruSubs', description: 'Premium movie, TV and subtitle discovery.', url: siteUrl },
  twitter: { card: 'summary_large_image', title: 'CineruSubs', description: 'Premium movie, TV and subtitle discovery.' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#080a0f', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: ReactNode }) {
  const organization = { '@context': 'https://schema.org', '@type': 'Organization', name: 'CineruSubs', url: siteUrl };
  const website = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'CineruSubs', url: siteUrl, potentialAction: { '@type': 'SearchAction', target: `${siteUrl}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' } };
  return <html lang="en" data-scroll-behavior="smooth"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replaceAll('<', '\\u003c') }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replaceAll('<', '\\u003c') }} /><PwaRegister />{children}</body></html>;
}
