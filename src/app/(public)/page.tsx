import type { Metadata } from 'next';
import { Info, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { MediaRow } from '@/components/movie/media-row';
import { TrailerDialog } from '@/components/movie/trailer-dialog';
import { WatchlistButton } from '@/components/movie/watchlist-button';
import { SubtitleCard } from '@/components/subtitle/subtitle-card';
import { SeriesCard } from '@/components/tv/series-card';
import { getMovies, getSeries, getSubtitles } from '@/services/catalog';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default async function HomePage() {
  const [movies, series, subtitles] = await Promise.all([getMovies(), getSeries(), getSubtitles()]);
  const hero = movies.find((movie) => movie.featured) ?? movies[0]!;
  const topRated = [...movies].sort((a, b) => (b.imdbRating ?? 0) - (a.imdbRating ?? 0));
  const newReleases = [...movies].sort((a, b) => b.year - a.year);
  return <>
    <section className="home-hero" aria-labelledby="hero-title"><div className="hero-backdrop"><Image src={hero.backdropUrl} alt="" fill priority sizes="100vw" /></div><div className="hero-content"><div className="hero-content-inner"><span className="hero-kicker">CineSeya.lk featured presentation</span><h1 id="hero-title">{hero.title}</h1>{hero.sinhalaTitle && <p className="hero-sinhala" lang="si">{hero.sinhalaTitle}</p>}<div className="hero-meta"><span className="rating">★ {hero.imdbRating?.toFixed(1)}</span><i/><span>{hero.year}</span><i/><span>{hero.runtime} min</span><i/><span>{hero.genres.join(' · ')}</span><span className="age">{hero.ageRating}</span></div><p className="hero-description">{hero.overview}</p><div className="hero-actions"><Link className="action-button" href={`/movies/${hero.slug}`}><Info />View Details</Link>{hero.trailerUrl && <TrailerDialog title={hero.title} url={hero.trailerUrl}/>}<WatchlistButton id={hero.id} slug={hero.slug} title={hero.title} posterUrl={hero.posterUrl} label /></div></div></div><aside className="hero-side-note"><b><ShieldCheck /> Rights-aware access</b>Full media controls appear only when a verified, distributable version is active.</aside></section>
    <div className="home-content">
      <MediaRow eyebrow="What everyone is watching" title="Trending Now" href="/discover?sort=trending" movies={movies.filter((movie) => movie.trending)} />
      <section className="media-section subtitle-home-section"><header className="section-heading"><div><span>Freshly timed and reviewed</span><h2>Latest Sinhala Subtitles</h2></div><Link href="/subtitles/sinhala">View all <span aria-hidden="true">→</span></Link></header><div className="subtitle-home-list">{subtitles.filter((subtitle) => subtitle.languageCode === 'si').slice(0, 3).map((subtitle) => <SubtitleCard key={subtitle.id} subtitle={subtitle} compact />)}</div></section>
      <MediaRow eyebrow="Recently added" title="New Releases" href="/movies?sort=newest" movies={newReleases} />
      <MediaRow eyebrow="Audience favourites" title="Top Rated" href="/discover?sort=rating" movies={topRated} />
      <section className="media-section"><header className="section-heading"><div><span>Continue the story</span><h2>Latest TV Episodes</h2></div><Link href="/tv">View all <span aria-hidden="true">→</span></Link></header><div className="media-row series-row">{series.map((item) => <SeriesCard key={item.id} series={item}/>)}</div></section>
      <MediaRow eyebrow="Curated by CineSeya.lk" title="Editors’ Picks" href="/discover?sort=rating" movies={movies.filter((movie) => movie.editorPick)} />
      <MediaRow eyebrow="Open and licensed animation" title="Animation" href="/discover?genre=Animation" movies={movies.filter((movie) => movie.genres.includes('Animation'))} />
      <MediaRow eyebrow="Most trusted releases" title="Most Downloaded Subtitles" href="/subtitles?sort=downloads" movies={[...movies].sort((a,b) => b.subtitleDownloadCount-a.subtitleDownloadCount)} />
    </div>
  </>;
}
