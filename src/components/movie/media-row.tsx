import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { MovieRecord } from '@/types/content';
import { MovieCard } from './movie-card';

export function MediaRow({ title, eyebrow, href, movies }: { title: string; eyebrow?: string; href: string; movies: MovieRecord[] }) {
  if (!movies.length) return null;
  return <section className="media-section"><header className="section-heading"><div>{eyebrow && <span>{eyebrow}</span>}<h2>{title}</h2></div><Link href={href}>View all <ArrowRight /></Link></header><div className="media-row">{movies.map((movie) => <MovieCard movie={movie} key={movie.id} />)}</div></section>;
}
