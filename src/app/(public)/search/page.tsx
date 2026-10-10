import type { Metadata } from 'next';
import { Search } from 'lucide-react';
import { CatalogGrid } from '@/components/movie/catalog-grid';
import { SeriesCard } from '@/components/tv/series-card';
import { getMovies, getSeries } from '@/services/catalog';

export const metadata: Metadata = { title: 'Search', robots: { index: false, follow: true } };
export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const [movies, allSeries] = await Promise.all([q ? getMovies({ q }) : Promise.resolve([]), getSeries()]);
  const normalized = q.normalize('NFKC').toLocaleLowerCase();
  const series = q ? allSeries.filter((item) => [item.title,item.sinhalaTitle,item.overview,...item.genres].filter(Boolean).some((value) => String(value).normalize('NFKC').toLocaleLowerCase().includes(normalized))) : [];
  return <div className="page-shell search-page"><header className="page-heading"><div><span>Fast, Unicode-aware discovery</span><h1>{q ? `Results for “${q}”` : 'Search CineSeya.lk'}</h1><p>Search English or Sinhala titles, genres, languages, people and translators.</p></div></header><form className="search-page-form"><Search/><input name="q" defaultValue={q} placeholder="Movie, series, actor or translator…" autoFocus/><button>Search</button></form>{q && <><section className="search-results-section"><h2>Movies <span>{movies.length}</span></h2><CatalogGrid movies={movies} emptyTitle="No matching movies"/></section>{series.length > 0 && <section className="search-results-section"><h2>TV Series <span>{series.length}</span></h2><div className="catalog-grid series-catalog">{series.map((item) => <SeriesCard key={item.id} series={item}/>)}</div></section>}</>}</div>;
}
