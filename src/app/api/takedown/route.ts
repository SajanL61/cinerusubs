import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { connectDb } from '@/lib/db';
import { useDemoData } from '@/lib/env';
import { apiError } from '@/lib/http';
import { enforceRateLimit } from '@/lib/rate-limit';
import { TakedownRequest } from '@/models';

const schema=z.object({requester:z.string().trim().min(2).max(100),email:z.email(),contentUrl:z.url(),reason:z.string().trim().min(20).max(4000),website:z.literal('').optional()}).strict();
export async function POST(request:Request){try{await enforceRateLimit(request,'takedown',5,60*60_000);const input=schema.parse(await request.json());let reference=`TD-${randomBytes(4).toString('hex').toUpperCase()}`;if(!useDemoData){await connectDb();const record=await TakedownRequest.create({...input,status:'new'});reference=`TD-${String(record._id).slice(-8).toUpperCase()}`}return Response.json({accepted:true,reference},{status:201})}catch(error){return apiError(error)}}
