import { UserRound } from 'lucide-react';
import { notFound } from 'next/navigation';
import { CatalogGrid } from '@/components/movie/catalog-grid';
import { getMovies } from '@/services/catalog';

export const dynamic='force-dynamic';
export default async function PersonPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const movies=await getMovies();const credits=movies.filter(movie=>[...movie.cast,...movie.crew].some(person=>person.slug===slug));const person=credits.flatMap(movie=>[...movie.cast,...movie.crew]).find(item=>item.slug===slug);if(!person)notFound();return <div className="page-shell person-page"><header><span><UserRound/></span><div><p className="eyebrow">Cast & crew</p><h1>{person.name}</h1><p>{person.role??person.character??'Film contributor'}</p></div></header><section><h2>Known for</h2><CatalogGrid movies={credits}/></section></div>}
