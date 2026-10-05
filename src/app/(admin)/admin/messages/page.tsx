import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Contact messages'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="messages" title="Contact messages" description="Triage contact enquiries submitted through the public site." permission="moderation.read" query={p.q}/>;}
