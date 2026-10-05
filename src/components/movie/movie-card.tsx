import { Play, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { MovieRecord } from '@/types/content';
import { WatchlistButton } from './watchlist-button';

export function MovieCard({ movie, priority = false }: { movie: MovieRecord; priority?: boolean }) {
  const rating = movie.imdbRating ?? movie.tmdbRating;
  return <article className="movie-card">
    <div className="movie-card-art">
      <Link href={`/movies/${movie.slug}`} aria-label={`View ${movie.title}`}><Image src={movie.posterUrl} alt={`${movie.title} poster`} fill priority={priority} sizes="(max-width: 520px) 42vw, (max-width: 1000px) 25vw, 190px" /></Link>
      <div className="card-badges">{movie.trending && <span className="badge-hot">TRENDING</span>}{movie.qualities[0] && <span>{movie.qualities[0]}</span>}</div>
      <div className="card-quick-actions"><Link href={`/movies/${movie.slug}`} aria-label={`Open ${movie.title}`}><Play /></Link><WatchlistButton id={movie.id} slug={movie.slug} title={movie.title} posterUrl={movie.posterUrl} /></div>
      {movie.subtitleLanguages.includes('Sinhala') && <span className="subtitle-ribbon">සිංහල SUB</span>}
    </div>
    <div className="movie-card-copy"><Link href={`/movies/${movie.slug}`}><h3>{movie.title}</h3></Link><p><span>{movie.year}</span><i /> <span>{movie.languages[0]}</span>{rating && <><i /><span className="card-rating"><Star />{rating.toFixed(1)}</span></>}</p></div>
  </article>;
}
