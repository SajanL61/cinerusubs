import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { z } from 'zod';
import { createSession, hashPassword, permit, requireAuth, setSessionCookie, verifyPassword } from '../auth.js';
import { AuditEvent, Category, Content, Inventory, InventoryMovement, Order, Payment, Product, Reservation, ReturnRequest, Session, Setting, User, Variant } from '../models.js';
import { transitionOrder } from '../services/orders.js';

export const adminRouter = Router();
const loginLimit = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

adminRouter.post('/auth/login', loginLimit, async (req, res) => {
  const input = z.object({ email: z.email(), password: z.string().min(10).max(128) }).strict().parse(req.body);
  const user = await User.findOne({ email: input.email.toLowerCase(), active: true }).select('+passwordHash');
  if (!user || !(await verifyPassword(user.passwordHash, input.password))) return res.status(401).json({ error: { code: 'INVALID_LOGIN', message: 'Email or password is incorrect' } });
  const { token, csrfToken } = await createSession(String(user._id)); setSessionCookie(res, token);
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role, permissions: user.permissions }, csrfToken });
});

adminRouter.use(requireAuth);
adminRouter.get('/auth/me', (req, res) => res.json({ user: req.admin }));
adminRouter.post('/auth/logout', async (req, res) => { await Session.deleteOne({ _id: req.sessionId }); res.clearCookie('admin_session'); res.status(204).end(); });
adminRouter.post('/auth/password', async (req, res) => {
  const input = z.object({ currentPassword: z.string(), newPassword: z.string().min(12).max(128) }).strict().parse(req.body);
  const user = await User.findById(req.admin!.id).select('+passwordHash');
  if (!user || !(await verifyPassword(user.passwordHash, input.currentPassword))) return res.status(422).json({ error: { code: 'PASSWORD_INVALID', message: 'Current password is incorrect' } });
  user.passwordHash = await hashPassword(input.newPassword); user.passwordChangedAt = new Date(); await user.save(); await Session.deleteMany({ user: user._id, _id: { $ne: req.sessionId } }); res.status(204).end();
});

adminRouter.get('/dashboard', permit('reports:read'), async (_req, res) => {
  const offsetMinutes=330;
  const localNow=new Date(Date.now()+offsetMinutes*60_000);
  localNow.setUTCHours(0,0,0,0);
  const today=new Date(localNow.getTime()-offsetMinutes*60_000);
  const trendStart=new Date(today.getTime()-6*86_400_000);
  const [newOrders,awaiting,dispatch,products,variants,inventory,recent,receipts,outstanding,trendRows,topProducts,returnsAttention]=await Promise.all([
    Order.countDocuments({createdAt:{$gte:today}}),
    Order.countDocuments({lifecycle:'pending_confirmation'}),
    Order.countDocuments({lifecycle:'confirmed',fulfilmentState:{$in:['unfulfilled','packing']}}),
    Product.countDocuments({status:'published'}),
    Variant.countDocuments({active:true}),
    Inventory.aggregate([
      {$lookup:{from:'variants',localField:'variant',foreignField:'_id',as:'variantDoc'}},
      {$set:{available:{$subtract:['$onHand','$reserved']},threshold:{$ifNull:[{$arrayElemAt:['$variantDoc.lowStockThreshold',0]},3]}}},
      {$group:{_id:null,onHand:{$sum:'$onHand'},reserved:{$sum:'$reserved'},available:{$sum:'$available'},damaged:{$sum:'$damaged'},low:{$sum:{$cond:[{$and:[{$gt:['$available',0]},{$lte:['$available','$threshold']}]},1,0]}},out:{$sum:{$cond:[{$lte:['$available',0]},1,0]}}}}
    ]),
    Order.find().sort({createdAt:-1}).limit(8).select('orderNumber address.name total lifecycle paymentState fulfilmentState createdAt'),
    Payment.aggregate([{$match:{status:'paid',createdAt:{$gte:today}}},{$group:{_id:null,total:{$sum:'$amount'}}}]),
    Order.aggregate([{$match:{lifecycle:{$ne:'cancelled'},paymentMethod:'cod',paymentState:{$ne:'paid'}}},{$group:{_id:null,total:{$sum:'$total'}}}]),
    Payment.aggregate([{$match:{status:'paid',createdAt:{$gte:trendStart}}},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$createdAt',timezone:'+05:30'}},total:{$sum:'$amount'}}},{$sort:{_id:1}}]),
    Order.aggregate([{$match:{lifecycle:{$in:['confirmed','completed']}}},{$unwind:'$items'},{$group:{_id:{product:'$items.productName',sku:'$items.sku'},quantity:{$sum:'$items.quantity'},revenue:{$sum:'$items.lineTotal'}}},{$sort:{quantity:-1,revenue:-1}},{$limit:5}]),
    ReturnRequest.countDocuments({status:{$in:['requested','received','inspection']}})
  ]);
  const trendByDate=new Map(trendRows.map((row:any)=>[row._id,row.total]));
  const salesTrend=Array.from({length:7},(_,index)=>{const moment=new Date(trendStart.getTime()+index*86_400_000);const localDate=new Date(moment.getTime()+offsetMinutes*60_000);const key=localDate.toISOString().slice(0,10);return {date:key,label:new Intl.DateTimeFormat('en-LK',{month:'short',day:'numeric',timeZone:'Asia/Colombo'}).format(moment),amount:trendByDate.get(key)||0}});
  res.json({newOrders,awaitingConfirmation:awaiting,awaitingDispatch:dispatch,productCount:products,activeSkuCount:variants,inventory:inventory[0]||{onHand:0,reserved:0,available:0,damaged:0,low:0,out:0},paymentsReceived:receipts[0]?.total||0,outstandingCod:outstanding[0]?.total||0,returnsAttention,salesTrend,topProducts:topProducts.map((row:any)=>({product:row._id.product,sku:row._id.sku,quantity:row.quantity,revenue:row.revenue})),recent,refreshedAt:new Date()});
});

adminRouter.get('/products', permit('products:read'), async (_req, res) => res.json(await Product.find().populate('category', 'name').sort({ updatedAt: -1 }).lean()));
adminRouter.get('/categories', permit('products:read'), async (_req, res) => res.json(await Category.find().sort({ displayOrder: 1, name: 1 }).lean()));
adminRouter.post('/categories', permit('products:write'), async (req, res) => { const input = z.object({ name: z.string().min(2).max(80), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().max(500).default(''), visible: z.boolean().default(true) }).strict().parse(req.body); res.status(201).json(await Category.create(input)); });
adminRouter.post('/products', permit('products:write'), async (req, res) => {
  const schema = z.object({ name: z.string().min(2), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().min(10), categoryId: z.string().regex(/^[a-f\d]{24}$/i), status: z.enum(['draft', 'published']).default('draft'), featured: z.boolean().default(false), images: z.array(z.object({ url: z.url(), alt: z.string().max(160) })).default([]), variants: z.array(z.object({ sku: z.string().min(2).max(60), options: z.record(z.string(), z.string()), price: z.number().int().nonnegative(), costPrice: z.number().int().nonnegative().optional(), onHand: z.number().int().nonnegative(), lowStockThreshold: z.number().int().nonnegative().default(3) })).min(1) }).strict();
  const input = schema.parse(req.body); const keys = input.variants.map(v => Object.entries(v.options).sort().map(([k, val]) => `${k}:${val}`).join('|'));
  if (new Set(keys).size !== keys.length) return res.status(422).json({ error: { code: 'DUPLICATE_OPTIONS', message: 'Variant option combinations must be unique' } });
  const session = await mongoose.startSession(); let created: any;
  try { await session.withTransaction(async () => {
    const [product] = await Product.create([{ name: input.name, slug: input.slug, description: input.description, category: input.categoryId, status: input.status, featured: input.featured, images: input.images, publishedAt: input.status === 'published' ? new Date() : undefined }], { session });
    for (let i = 0; i < input.variants.length; i++) { const v = input.variants[i]!; const [variant] = await Variant.create([{ product: product._id, sku: v.sku, options: v.options, optionKey: keys[i], price: v.price, costPrice: v.costPrice, lowStockThreshold: v.lowStockThreshold }], { session });
      await Inventory.create([{ variant: variant._id, sku: v.sku, onHand: v.onHand, reserved: 0 }], { session });
      await InventoryMovement.create([{ variant: variant._id, sku: v.sku, type: 'receipt', quantity: v.onHand, reason: 'Initial stock', actor: req.admin!.id, operationKey: `product:${product._id}:initial:${variant._id}`, before: { onHand: 0, reserved: 0, damaged: 0 }, after: { onHand: v.onHand, reserved: 0, damaged: 0 } }], { session }); }
    created = product; await AuditEvent.create([{ actor: req.admin!.id, action: 'product.create', entity: 'Product', entityId: String(product._id) }], { session });
  }); } finally { await session.endSession(); }
  res.status(201).json(created);
});

adminRouter.get('/inventory', permit('inventory:read'), async (req, res) => {
  const input = z.object({
    q: z.string().trim().max(80).default(''),
    status: z.enum(['all','in_stock','low_stock','out_of_stock']).default('all'),
    sort: z.enum(['sku','product','available_asc','available_desc','updated']).default('product'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  }).parse(req.query);
  const rows:any[] = await Inventory.find().populate({ path:'variant', select:'sku options price salePrice costPrice lowStockThreshold active __v product', populate:{ path:'product', select:'name images category', populate:{ path:'category', select:'name' } } }).lean();
  const canViewCost = req.admin!.role === 'owner' || req.admin!.permissions.includes('finance:read') || req.admin!.permissions.includes('finance:write');
  const canEditCost = req.admin!.role === 'owner' || req.admin!.permissions.includes('finance:write');
  let items=rows.filter(i=>i.variant?.product).map(i=>{
    const available=i.onHand-i.reserved;
    const threshold=i.variant.lowStockThreshold||0;
    const status=available<=0?'out_of_stock':available<=threshold?'low_stock':'in_stock';
    const options=i.variant.options instanceof Map?Object.fromEntries(i.variant.options):i.variant.options||{};
    return {id:String(i._id),variantId:String(i.variant._id),variantVersion:i.variant.__v||0,productId:String(i.variant.product._id),product:i.variant.product.name,image:i.variant.product.images?.[0]?.url||'',category:i.variant.product.category?.name||'Uncategorized',sku:i.sku,colour:options.Colour||options.colour||'—',size:options.Size||options.size||'—',onHand:i.onHand,reserved:i.reserved,available,damaged:i.damaged||0,lowStockThreshold:threshold,status,price:i.variant.price,salePrice:i.variant.salePrice,...(canViewCost?{costPrice:i.variant.costPrice??null}:{}),version:i.version,active:i.variant.active,updatedAt:i.updatedAt};
  });
  const q=input.q.toLowerCase();
  if(q)items=items.filter(i=>[i.product,i.sku,i.category,i.colour,i.size].some(v=>String(v).toLowerCase().includes(q)));
  if(input.status!=='all')items=items.filter(i=>i.status===input.status);
  items.sort((a,b)=>input.sort==='sku'?a.sku.localeCompare(b.sku):input.sort==='available_asc'?a.available-b.available:input.sort==='available_desc'?b.available-a.available:input.sort==='updated'?new Date(b.updatedAt).getTime()-new Date(a.updatedAt).getTime():a.product.localeCompare(b.product)||a.sku.localeCompare(b.sku));
  const totals=items.reduce((t,i)=>({onHand:t.onHand+i.onHand,reserved:t.reserved+i.reserved,available:t.available+i.available,damaged:t.damaged+i.damaged,low:t.low+(i.status==='low_stock'?1:0),out:t.out+(i.status==='out_of_stock'?1:0)}),{onHand:0,reserved:0,available:0,damaged:0,low:0,out:0});
  const total=items.length;
  const start=(input.page-1)*input.limit;
  res.json({items:items.slice(start,start+input.limit),page:input.page,pages:Math.ceil(total/input.limit),total,totals,capabilities:{viewCost:canViewCost,editCost:canEditCost}});
});
adminRouter.post('/inventory/:id/adjust', permit('inventory:write'), async (req, res) => {
  const input = z.object({ mode:z.enum(['receive','count','damage']), quantity:z.number().int().nonnegative(), reason:z.string().trim().min(4).max(300), version:z.number().int().nonnegative() }).strict().parse(req.body);
  if(input.mode!=='count'&&input.quantity<1)return res.status(422).json({error:{code:'QUANTITY_REQUIRED',message:'Quantity must be at least one'}});const key=String(req.get('idempotency-key')||'');if(!/^[A-Za-z0-9_-]{16,128}$/.test(key))return res.status(400).json({error:{code:'IDEMPOTENCY_KEY_REQUIRED',message:'A valid Idempotency-Key header is required'}});
  const session=await mongoose.startSession();let result:any;
  try{await session.withTransaction(async()=>{const operationKey=`admin-stock:${key}`;const prior=await InventoryMovement.findOne({operationKey}).session(session);if(prior){result=await Inventory.findById(req.params.id).session(session);return}const current=await Inventory.findOne({_id:req.params.id,version:input.version}).session(session);if(!current)throw Object.assign(new Error('Stock changed since this page loaded. Refresh and try again.'),{status:409,code:'EDIT_CONFLICT'});let onHand=current.onHand;let damaged=current.damaged||0;if(input.mode==='receive')onHand+=input.quantity;else if(input.mode==='count')onHand=input.quantity;else{onHand-=input.quantity;damaged+=input.quantity}if(onHand<current.reserved)throw Object.assign(new Error('On-hand stock cannot be lower than active reservations'),{status:422,code:'ACTIVE_RESERVATIONS'});const updated=await Inventory.findOneAndUpdate({_id:current._id,version:input.version},{$set:{onHand,damaged},$inc:{version:1}},{new:true,session});if(!updated)throw Object.assign(new Error('Stock changed. Refresh and try again.'),{status:409,code:'EDIT_CONFLICT'});await InventoryMovement.create([{variant:current.variant,sku:current.sku,type:input.mode,quantity:onHand-current.onHand,reason:input.reason,actor:req.admin!.id,operationKey,before:{onHand:current.onHand,reserved:current.reserved,damaged:current.damaged},after:{onHand,reserved:current.reserved,damaged}}],{session});await AuditEvent.create([{actor:req.admin!.id,action:`inventory.${input.mode}`,entity:'Inventory',entityId:String(current._id),metadata:{sku:current.sku,quantity:input.quantity,reason:input.reason}}],{session});result=updated});}finally{await session.endSession()}
  res.json({...result.toObject(),available:result.onHand-result.reserved});
});

adminRouter.get('/inventory/:id/movements',permit('inventory:read'),async(req,res)=>{const inventory:any=await Inventory.findById(req.params.id).lean();if(!inventory)return res.status(404).json({error:{code:'NOT_FOUND',message:'Inventory item not found'}});const movements=await InventoryMovement.find({variant:inventory.variant}).populate('actor','name role').populate('order','orderNumber').sort({createdAt:-1}).limit(100).lean();res.json(movements.map((m:any)=>({id:String(m._id),type:m.type,quantity:m.quantity,reason:m.reason,before:m.before,after:m.after,actor:m.actor?.name||'System',orderNumber:m.order?.orderNumber,createdAt:m.createdAt}))) });

adminRouter.get('/inventory/:id/reservations',permit('inventory:read'),async(req,res)=>{const inventory:any=await Inventory.findById(req.params.id).select('variant reserved').lean();if(!inventory)return res.status(404).json({error:{code:'NOT_FOUND',message:'Inventory item not found'}});const rows=await Reservation.find({variant:inventory.variant,state:'active'}).populate('order','orderNumber lifecycle paymentState fulfilmentState channel reservationExpiresAt createdAt').sort({createdAt:-1}).lean();const items=rows.map((row:any)=>({id:String(row._id),quantity:row.quantity,state:row.state,expiresAt:row.expiresAt,createdAt:row.createdAt,order:row.order?{id:String(row.order._id),orderNumber:row.order.orderNumber,lifecycle:row.order.lifecycle,paymentState:row.order.paymentState,fulfilmentState:row.order.fulfilmentState,channel:row.order.channel,reservationExpiresAt:row.order.reservationExpiresAt}:null}));const total=items.reduce((sum:number,row:any)=>sum+row.quantity,0);res.json({items,total,balance:inventory.reserved,consistent:total===inventory.reserved})});

adminRouter.patch('/variants/:id/pricing',permit('products:write'),async(req,res)=>{
  const input=z.object({price:z.number().int().nonnegative(),costPrice:z.number().int().nonnegative().nullable().optional(),salePrice:z.number().int().nonnegative().nullable().optional(),lowStockThreshold:z.number().int().nonnegative(),version:z.number().int().nonnegative()}).strict().parse(req.body);
  const canEditCost=req.admin!.role==='owner'||req.admin!.permissions.includes('finance:write');
  if(input.costPrice!==undefined&&!canEditCost)return res.status(403).json({error:{code:'FORBIDDEN',message:'Financial permission is required to change private cost'}});
  if(input.salePrice!=null&&input.salePrice>=input.price)return res.status(422).json({error:{code:'SALE_PRICE_INVALID',message:'Sale price must be lower than the regular price'}});
  const set:any={price:input.price,lowStockThreshold:input.lowStockThreshold};
  const unset:any={};
  for(const field of ['costPrice','salePrice'] as const){if(input[field]===null)unset[field]=1;else if(input[field]!==undefined)set[field]=input[field]}
  const update:any={$set:set,$inc:{__v:1}};
  if(Object.keys(unset).length)update.$unset=unset;
  const variant=await Variant.findOneAndUpdate({_id:req.params.id,__v:input.version},update,{new:true});
  if(!variant)return res.status(409).json({error:{code:'EDIT_CONFLICT',message:'Pricing changed since this page loaded. Refresh and try again.'}});
  await AuditEvent.create({actor:req.admin!.id,action:'variant.pricing',entity:'Variant',entityId:String(variant._id),metadata:{sku:variant.sku,price:variant.price,salePrice:variant.salePrice,costPriceChanged:input.costPrice!==undefined,lowStockThreshold:variant.lowStockThreshold}});
  res.json({id:variant._id,price:variant.price,salePrice:variant.salePrice,...(canEditCost?{costPrice:variant.costPrice}:{}),lowStockThreshold:variant.lowStockThreshold,version:variant.__v});
});

adminRouter.get('/transactions',permit('reports:read'),async(req,res)=>{const input=z.object({q:z.string().trim().max(80).default(''),page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(100).default(50)}).parse(req.query);const filter:any={};if(input.q){const safe=input.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=[{orderNumber:{$regex:safe,$options:'i'}},{'address.name':{$regex:safe,$options:'i'}}]}const orders=await Order.find(filter).sort({createdAt:-1}).skip((input.page-1)*input.limit).limit(input.limit).select('orderNumber address.name total channel paymentMethod paymentState lifecycle fulfilmentState createdAt').lean();const payments=await Payment.find().populate('order','orderNumber').sort({createdAt:-1}).limit(100).lean();const summary=await Order.aggregate([{$match:{lifecycle:{$ne:'cancelled'}}},{$group:{_id:null,placedValue:{$sum:'$total'},paidOrderValue:{$sum:{$cond:[{$eq:['$paymentState','paid']},'$total',0]}},outstandingCod:{$sum:{$cond:[{$and:[{$eq:['$paymentMethod','cod']},{$ne:['$paymentState','paid']}]},'$total',0]}}}}]);const receipts=await Payment.aggregate([{$match:{status:'paid'}},{$group:{_id:null,total:{$sum:'$amount'}}}]);res.json({orders,payments:payments.map((p:any)=>({id:p._id,orderNumber:p.order?.orderNumber,amount:p.amount,method:p.method,status:p.status,reference:p.providerReference,createdAt:p.createdAt})),summary:{placedOrderValue:summary[0]?.placedValue||0,paidOrderValue:summary[0]?.paidOrderValue||0,paymentReceipts:receipts[0]?.total||0,outstandingCod:summary[0]?.outstandingCod||0},page:input.page,total:await Order.countDocuments(filter)})});

adminRouter.get('/orders', permit('orders:read'), async (req, res) => { const filter: any = {}; for (const key of ['lifecycle', 'paymentState', 'fulfilmentState', 'channel']) if (typeof req.query[key] === 'string') filter[key] = req.query[key]; res.json(await Order.find(filter).sort({ createdAt: -1 }).limit(100).lean()); });
adminRouter.post('/orders/:id/payment',permit('payments:write'),async(req,res)=>{
  const input=z.object({action:z.enum(['verify_bank','collect_cod']),reference:z.string().trim().min(3).max(120)}).strict().parse(req.body);
  const key=String(req.get('idempotency-key')||'');
  if(!/^[A-Za-z0-9_-]{16,128}$/.test(key))return res.status(400).json({error:{code:'IDEMPOTENCY_KEY_REQUIRED',message:'A valid Idempotency-Key header is required'}});
  const eventKey=`admin-payment:${key}`;
  const session=await mongoose.startSession();let result:any;let replayed=false;
  try{await session.withTransaction(async()=>{
    const prior=await Payment.findOne({eventKey}).session(session);
    if(prior){result=prior;replayed=true;return}
    const order=await Order.findById(req.params.id).session(session);
    if(!order)throw Object.assign(new Error('Order not found'),{status:404,code:'NOT_FOUND'});
    if(order.lifecycle==='cancelled')throw Object.assign(new Error('Payment cannot be recorded against a cancelled order'),{status:409,code:'ORDER_CANCELLED'});
    const requiredMethod=input.action==='verify_bank'?'bank_transfer':'cod';
    if(order.paymentMethod!==requiredMethod)throw Object.assign(new Error(`This order uses ${String(order.paymentMethod).replaceAll('_',' ')}`),{status:422,code:'PAYMENT_METHOD_MISMATCH'});
    const previous=await Payment.find({order:order._id,status:'paid'}).select('amount').session(session);
    const paidTotal=previous.reduce((sum:number,payment:any)=>sum+payment.amount,0);
    const remaining=Math.max(0,order.total-paidTotal);
    if(!remaining)throw Object.assign(new Error('This order is already fully paid'),{status:409,code:'ALREADY_PAID'});
    const [payment]=await Payment.create([{order:order._id,amount:remaining,method:requiredMethod,status:'paid',providerReference:input.reference,eventKey}],{session});
    order.paymentState='paid';
    order.timeline.push({type:'payment_recorded',note:`${requiredMethod.replaceAll('_',' ')} verified; reference ${input.reference}`,actor:req.admin!.id});
    await order.save({session});
    await AuditEvent.create([{actor:req.admin!.id,action:'payment.record',entity:'Order',entityId:String(order._id),metadata:{orderNumber:order.orderNumber,amount:remaining,method:requiredMethod,reference:input.reference}}],{session});
    result=payment;
  })}finally{await session.endSession()}
  res.status(replayed?200:201).json({id:result._id,amount:result.amount,status:result.status,replayed});
});
adminRouter.post('/orders/:id/transition', permit('orders:write'), async (req, res) => { const input = z.object({ action: z.enum(['confirm', 'pack', 'dispatch', 'deliver', 'cancel']), reason: z.string().max(500).default('') }).strict().parse(req.body); res.json(await transitionOrder(String(req.params.id), input.action, req.admin!.id, input.reason)); });

const contentKey = z.enum(['about','contact','size-guide','delivery','returns','faq','privacy','terms']);
adminRouter.get('/content', permit('settings:read'), async (_req, res) => {
  const pages = await Content.find({ key:{ $in:contentKey.options } }).select('key title body status updatedAt').sort({ key:1 }).lean();
  res.json(pages);
});
adminRouter.patch('/content/:key', permit('settings:write'), async (req, res) => {
  const key = contentKey.parse(req.params.key);
  const input = z.object({
    title:z.string().trim().min(2).max(120),
    body:z.string().trim().min(40).max(30_000),
    status:z.enum(['draft','published'])
  }).strict().parse(req.body);
  const page = await Content.findOneAndUpdate({ key }, { $set:input }, { upsert:true, new:true, runValidators:true });
  await AuditEvent.create({ actor:req.admin!.id, action:'content.update', entity:'Content', entityId:String(page._id), metadata:{ key, status:input.status } });
  res.json({ key:page.key, title:page.title, body:page.body, status:page.status, updatedAt:page.updatedAt });
});

adminRouter.get('/settings', permit('settings:read'), async (_req, res) => res.json(await Setting.find().lean()));
adminRouter.put('/settings/:key', permit('settings:write'), async (req, res) => { const key = String(req.params.key); if (!['store', 'homepage', 'delivery'].includes(key)) return res.status(404).end(); const value = z.record(z.string(), z.unknown()).parse(req.body); res.json(await Setting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })); });
