import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Takedowns'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="takedowns" title="Takedown requests" description="Review rights-holder requests with clear resolution status." permission="moderation.read" query={p.q}/>;}
