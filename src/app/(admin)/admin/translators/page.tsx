import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Translators'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="translators" title="Translators" description="Maintain credited translator profiles and verification." permission="subtitles.read" query={p.q}/>;}
