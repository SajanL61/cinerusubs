import { SubtitleForm } from '@/components/admin/subtitle-form';
import { requirePagePermission } from '@/lib/auth';
export const metadata={title:'Upload subtitle'};
export default async function NewSubtitlePage(){const{user}=await requirePagePermission('subtitles.create','/admin/subtitles/new');return <><header className="admin-page-head"><div><span>Contributor workflow</span><h1>Upload subtitle</h1><p>The file is verified in R2, then saved as a draft. A verifier must review it before publication.</p></div></header><SubtitleForm translatorLocked={user.role==='translator'}/></>;}
