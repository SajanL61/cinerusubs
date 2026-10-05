import type { Metadata } from 'next';
import Link from 'next/link';
import { SubtitleCard } from '@/components/subtitle/subtitle-card';
import { getSubtitles } from '@/services/catalog';

export const metadata: Metadata = { title: 'Subtitles', description: 'Download verified Sinhala, English and Tamil subtitles matched to specific releases.' };
export const dynamic = 'force-dynamic';
export default async function SubtitlesPage() { const subtitles = await getSubtitles(); return <div className="page-shell subtitles-page"><header className="page-heading"><div><span>Precision-timed by contributors</span><h1>Subtitles</h1><p>Verified release matching, clear formats and translator attribution—so you know exactly what you are downloading.</p></div><strong className="result-count">{subtitles.length} releases</strong></header><nav className="language-tabs"><Link className="active" href="/subtitles">All languages</Link><Link href="/subtitles/sinhala">Sinhala</Link><Link href="/subtitles/english">English</Link><Link href="/subtitles/tamil">Tamil</Link></nav><div className="subtitle-list">{subtitles.map((subtitle) => <SubtitleCard key={subtitle.id} subtitle={subtitle}/>)}</div></div>; }
