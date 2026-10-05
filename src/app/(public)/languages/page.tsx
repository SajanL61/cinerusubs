import type { Metadata } from 'next';
import Link from 'next/link';
import { getMovies } from '@/services/catalog';

export const metadata: Metadata = { title: 'Languages', description: 'Browse movies, TV and subtitles by language.' };
export const dynamic = 'force-dynamic';
export default async function LanguagesPage() { const movies = await getMovies(); const languages = Array.from(new Set(movies.flatMap((movie) => movie.languages))).sort(); return <div className="page-shell"><header className="page-heading"><div><span>Cinema without borders</span><h1>Languages</h1><p>Browse original-language cinema and find compatible Sinhala, English and Tamil subtitle releases.</p></div></header><div className="taxonomy-grid language-grid">{languages.map((language,index) => <Link href={`/discover?language=${encodeURIComponent(language)}`} key={language}><b>{String(index+1).padStart(2,'0')}</b><h2>{language}</h2><span>{movies.filter((movie) => movie.languages.includes(language)).length} titles</span><i>Browse language →</i></Link>)}</div></div>; }
