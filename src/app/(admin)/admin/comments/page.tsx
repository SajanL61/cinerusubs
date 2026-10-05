import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Comments'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="comments" title="Comments" description="Moderate community discussion while retaining an auditable record." permission="moderation.read" query={p.q}/>;}
