import type { Metadata } from 'next';
import { CatalogGrid } from '@/components/movie/catalog-grid';
import { getMovies } from '@/services/catalog';
import type { DiscoverFilters } from '@/types/content';

export const metadata: Metadata = { title: 'Movies', description: 'Browse movies with Sinhala and English subtitle availability on CineruSubs.', alternates: { canonical: '/movies' } };
export const dynamic = 'force-dynamic';

export default async function MoviesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters: DiscoverFilters = { sort: typeof params.sort === 'string' ? params.sort as DiscoverFilters['sort'] : 'newest', genre: typeof params.genre === 'string' ? params.genre : undefined, language: typeof params.language === 'string' ? params.language : undefined };
  const movies = await getMovies(filters);
  return <div className="page-shell"><header className="page-heading"><div><span>Explore the catalogue</span><h1>Movies</h1><p>From modern open productions to carefully catalogued classics, with verified subtitle compatibility at a glance.</p></div><strong className="result-count">{movies.length} titles</strong></header><CatalogGrid movies={movies}/></div>;
}
