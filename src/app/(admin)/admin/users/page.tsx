import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
export const metadata={title:'Users'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;return <AdminCollectionPage resource="users" title="Users" description="Review account state and role assignments. Sensitive credentials are never exposed." permission="users.read" query={p.q}/>;}
