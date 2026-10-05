import { AdminCollectionPage } from '@/components/admin/admin-collection-page';
import { UploadManager } from '@/components/admin/upload-manager';
import { requirePagePermission } from '@/lib/auth';
import { StorageAudit } from '@/components/admin/storage-audit';
import { getStorageStats } from '@/services/admin';
export const metadata={title:'Media storage'};
export default async function Page({searchParams}:{searchParams:Promise<{q?:string}>}){const p=await searchParams;const{user}=await requirePagePermission('media.read','/admin/media');const stats=await getStorageStats();return <><StorageAudit {...stats}/>{user.permissions.includes('media.upload')&&<UploadManager/>}<AdminCollectionPage resource="media" title="Media storage" description="Inspect R2-backed assets, link state, checksums and lifecycle status." permission="media.read" query={p.q}/></>;}
