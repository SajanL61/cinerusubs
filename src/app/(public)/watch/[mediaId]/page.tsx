import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdaptiveMediaPlayer } from '@/components/player/adaptive-media-player';
import { currentUser } from '@/lib/auth';
import { getPlayableMedia } from '@/services/media';

export const dynamic='force-dynamic';export const metadata={title:'Watch',robots:{index:false,follow:false}};
export default async function WatchPage({params}:PageProps<'/watch/[mediaId]'>){const{mediaId}=await params;const[media,user]=await Promise.all([getPlayableMedia(mediaId),currentUser()]);if(!media)notFound();const back=media.contentType==='movie'?`/movies/${media.slug}`:`/tv/${media.seriesSlug}`;return <section className="watch-page"><header><Link href={back}><ArrowLeft/>Back to title</Link><span><ShieldCheck/>Verified {media.releaseType}</span></header><AdaptiveMediaPlayer src={media.streamUrl} mimeType={media.mimeType} poster={media.posterUrl} title={media.title} contentType={media.contentType} contentId={media.contentId} authenticated={Boolean(user)}/><div className="watch-meta"><span>Now playing · {media.quality}</span><h1>{media.title}</h1><p>{user?'Your position is saved to this account.':'Sign in to sync viewing progress across devices.'}</p></div></section>;}
