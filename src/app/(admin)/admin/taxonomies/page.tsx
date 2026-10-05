import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Taxonomies'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="taxonomies" title="Genres & languages" description="Manage the controlled vocabulary used by discovery filters." permission="taxonomy.read" query={p.q}/>;}
