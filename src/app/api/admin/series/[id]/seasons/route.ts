import { isValidObjectId } from 'mongoose';
import { z } from 'zod';
import { assertMutationRequest, requirePermission } from '@/lib/auth';
import { connectDb } from '@/lib/db';
import { apiError } from '@/lib/http';
import { AuditLog, Season, Series } from '@/models';
const schema=z.object({seasonNumber:z.number().int().min(0).max(500),title:z.string().trim().min(1).max(160),overview:z.string().trim().max(4000).optional(),publicationStatus:z.enum(['draft','published','archived'])});
export async function POST(request:Request,{params}:RouteContext<'/api/admin/series/[id]/seasons'>){try{const session=await requirePermission('content.update');await assertMutationRequest(request,session);const{id}=await params;if(!isValidObjectId(id))throw Object.assign(new Error('Series was not found.'),{status:404,code:'NOT_FOUND'});const input=schema.parse(await request.json());await connectDb();if(!await Series.exists({_id:id}))throw Object.assign(new Error('Series was not found.'),{status:404,code:'NOT_FOUND'});const season=await Season.create({...input,series:id});await AuditLog.create({actor:session.user.id,action:'season.create',entity:'Season',entityId:String(season._id),metadata:{series:id,seasonNumber:season.seasonNumber}});return Response.json({id:String(season._id)},{status:201});}catch(error){return apiError(error);}}
