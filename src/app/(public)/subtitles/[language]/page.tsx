import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SubtitleCard } from '@/components/subtitle/subtitle-card';
import { getSubtitles } from '@/services/catalog';

const codes: Record<string,string> = { sinhala:'si', english:'en', tamil:'ta' };
export async function generateMetadata({ params }: { params: Promise<{ language: string }> }): Promise<Metadata> { const { language } = await params; if (!codes[language]) return {}; return { title: `${language[0]!.toUpperCase()}${language.slice(1)} Subtitles`, description: `Browse verified ${language} subtitles on CineruSubs.` }; }
export const dynamic = 'force-dynamic';
export default async function LanguageSubtitlesPage({ params }: { params: Promise<{ language: string }> }) { const { language } = await params; const code = codes[language]; if (!code) notFound(); const subtitles = await getSubtitles(code); return <div className="page-shell subtitles-page"><header className="page-heading"><div><span>Release-matched downloads</span><h1>{language[0]!.toUpperCase()}{language.slice(1)} Subtitles</h1><p>Verified subtitle files with translator credits, compatible releases, FPS, version and format details.</p></div><strong className="result-count">{subtitles.length} releases</strong></header><div className="subtitle-list">{subtitles.map((subtitle) => <SubtitleCard key={subtitle.id} subtitle={subtitle}/>)}</div></div>; }
