import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePagePermission } from '@/lib/auth';
export const metadata={title:'Subtitles'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;const{user}=await requirePagePermission('subtitles.read','/admin/subtitles');return <>{user.permissions.includes('subtitles.create')&&<div className="admin-quick-action"><Link className="admin-primary" href="/admin/subtitles/new"><Plus/>Upload subtitle</Link></div>}<AdminCollectionPage resource="subtitles" title="Subtitles" description="Review release matches, formats, translator credit and verification state." permission="subtitles.read" query={p.q}/></>;}
