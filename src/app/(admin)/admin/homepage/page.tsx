import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Homepage'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="homepage" title="Homepage sections" description="Control editorial rows, ordering and visibility without inventing content." permission="homepage.read" query={p.q}/>;}
