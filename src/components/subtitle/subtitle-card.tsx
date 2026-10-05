import { BadgeCheck, CalendarDays, Download, FileArchive, Gauge, HardDrive } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { SubtitleRecord } from '@/types/content';

function size(bytes: number) {
  return bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.ceil(bytes / 1_000)} KB`;
}

export function SubtitleCard({ subtitle, compact = false }: { subtitle: SubtitleRecord; compact?: boolean }) {
  return <article className={`subtitle-card ${compact ? 'compact' : ''}`}>
    {!compact && <Link className="subtitle-poster" href={`/movies/${subtitle.contentSlug}`}><Image src={subtitle.contentPosterUrl} alt="" fill sizes="76px" /></Link>}
    <div className="subtitle-main"><div className="subtitle-title"><div><span>{subtitle.language} Subtitle</span><h3>{subtitle.contentTitle}</h3></div>{subtitle.verified && <BadgeCheck aria-label="Verified subtitle" />}</div>
      <Link className="translator-line" href={`/translator/${subtitle.translatorSlug}`}>{subtitle.translatorAvatarUrl && <span><Image src={subtitle.translatorAvatarUrl} alt="" fill sizes="24px" /></span>}Translated by <b>{subtitle.translatorName}</b></Link>
      <div className="release-matches">{subtitle.releaseMatches.map((match) => <span key={match}>{match}</span>)}</div>
      <div className="subtitle-meta"><span><Gauge />{subtitle.fps ?? 'Variable'} FPS</span><span><FileArchive />{subtitle.format.toUpperCase()}</span><span><HardDrive />{size(subtitle.fileSize)}</span><span><CalendarDays />{new Date(subtitle.createdAt).toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
    </div>
    <div className="subtitle-download"><span><b>{subtitle.downloadCount.toLocaleString()}</b> downloads</span><a href={`/api/subtitles/${subtitle.id}/download`}><Download />Download subtitle</a><small>Version {subtitle.version}</small></div>
  </article>;
}
