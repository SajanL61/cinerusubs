import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { enforceRateLimit, requestClientKey } from '@/lib/rate-limit';
import { signedDownloadUrl } from '@/lib/r2';
import { assertMediaDistributionAllowed } from '@/lib/rights';
import { DownloadEvent, Episode, MediaVersion, Movie } from '@/models';
import type { RightsStatus } from '@/types/content';

export async function GET(request:Request,{params}:{params:Promise<{mediaId:string}>}){
  try{
    await enforceRateLimit(request,'media-download',12,10*60_000);
    await connectDb();const {mediaId}=await params;
    const version=await MediaVersion.findOne({_id:mediaId,active:true});
    if(!version)throw Object.assign(new Error('Media version is unavailable'),{status:404,code:'NOT_FOUND'});
    const content=version.contentType==='movie'?await Movie.findById(version.contentId):await Episode.findById(version.contentId);
    if(!content)throw Object.assign(new Error('Content is unavailable'),{status:404,code:'NOT_FOUND'});
    assertMediaDistributionAllowed(content.rightsStatus as RightsStatus,true);assertMediaDistributionAllowed(version.rightsStatus as RightsStatus,Boolean(version.active));
    const fileName=`cinerusubs-${String(version.resolution??version.quality??'media')}.${String(version.container??'mp4')}`;
    const url=await signedDownloadUrl(String(version.r2ObjectKey),fileName,60);
    await DownloadEvent.create({kind:'media',targetId:version._id,contentId:version.contentId,ipHash:requestClientKey(request)});
    return Response.redirect(url,302);
  }catch(error){return apiError(error)}
}
