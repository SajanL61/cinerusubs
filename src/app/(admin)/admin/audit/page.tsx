import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Audit log'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="audit" title="Audit log" description="Review security-sensitive administrative and authentication events." permission="audit.read" query={p.q}/>;}
