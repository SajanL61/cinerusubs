import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'TV series'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="series" title="TV series" description="Manage series metadata, seasons, episodes and publication state." permission="content.read" createHref="/admin/series/new" query={p.q}/>;}
