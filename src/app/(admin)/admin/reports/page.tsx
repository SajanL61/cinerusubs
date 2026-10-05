import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Reports'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="reports" title="Reports" description="Triage user reports and moderation issues." permission="moderation.read" query={p.q}/>;}
