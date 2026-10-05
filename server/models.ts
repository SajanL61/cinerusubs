import mongoose, { Schema, type Model } from 'mongoose';

const imageSchema = new Schema({ url: { type: String, required: true }, alt: { type: String, default: '' }, focalX: Number, focalY: Number }, { _id: false });

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, default: '' }, image: imageSchema, displayOrder: { type: Number, default: 0 }, visible: { type: Boolean, default: true }
}, { timestamps: true });
export const Category: Model<any> = (mongoose.models.Category as Model<any>) || mongoose.model<any>('Category', categorySchema);

const collectionSchema = new Schema({
  name: { type: String, required: true }, slug: { type: String, required: true, unique: true }, description: String,
  image: imageSchema, displayOrder: { type: Number, default: 0 }, visible: { type: Boolean, default: true }
}, { timestamps: true });
export const Collection: Model<any> = (mongoose.models.Collection as Model<any>) || mongoose.model<any>('Collection', collectionSchema);

const productSchema = new Schema({
  name: { type: String, required: true, trim: true }, slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true }, category: { type: Schema.Types.ObjectId, ref: 'Category' },
  collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }], tags: [{ type: String, index: true }], clothingType: String,
  material: String, fit: String, care: String, sizeGuide: String, images: [imageSchema],
  seo: { title: String, description: String }, status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  featured: { type: Boolean, default: false }, publishedAt: Date
}, { timestamps: true });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
export const Product: Model<any> = (mongoose.models.Product as Model<any>) || mongoose.model<any>('Product', productSchema);

const variantSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true }, sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  options: { type: Map, of: String, required: true }, optionKey: { type: String, required: true }, price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0 }, saleStart: Date, saleEnd: Date, costPrice: { type: Number, min: 0 }, images: [imageSchema],
  lowStockThreshold: { type: Number, min: 0, default: 3 }, active: { type: Boolean, default: true }
}, { timestamps: true, optimisticConcurrency: true });
variantSchema.index({ product: 1, optionKey: 1 }, { unique: true });
export const Variant: Model<any> = (mongoose.models.Variant as Model<any>) || mongoose.model<any>('Variant', variantSchema);

const inventorySchema = new Schema({
  variant: { type: Schema.Types.ObjectId, ref: 'Variant', required: true, unique: true }, sku: { type: String, required: true, unique: true },
  onHand: { type: Number, min: 0, default: 0 }, reserved: { type: Number, min: 0, default: 0 }, damaged: { type: Number, min: 0, default: 0 }, version: { type: Number, default: 0 }
}, { timestamps: true });
inventorySchema.virtual('available').get(function () { return this.onHand - this.reserved; });
export const Inventory: Model<any> = (mongoose.models.Inventory as Model<any>) || mongoose.model<any>('Inventory', inventorySchema);

const movementSchema = new Schema({
  variant: { type: Schema.Types.ObjectId, ref: 'Variant', required: true }, sku: { type: String, required: true }, type: { type: String, required: true },
  quantity: { type: Number, required: true }, reason: { type: String, required: true }, order: { type: Schema.Types.ObjectId, ref: 'Order' },
  actor: { type: Schema.Types.ObjectId, ref: 'User' }, operationKey: { type: String, unique: true, sparse: true },
  before: { onHand: Number, reserved: Number, damaged: Number }, after: { onHand: Number, reserved: Number, damaged: Number }
}, { timestamps: true });
export const InventoryMovement: Model<any> = (mongoose.models.InventoryMovement as Model<any>) || mongoose.model<any>('InventoryMovement', movementSchema);

const orderItemSchema = new Schema({
  productId: Schema.Types.ObjectId, variantId: Schema.Types.ObjectId, productName: String, slug: String, sku: String,
  options: { type: Map, of: String }, unitPrice: Number, quantity: Number, lineTotal: Number, image: String
}, { _id: false });
const orderTimelineSchema = new Schema({
  at: { type: Date, default: Date.now }, type: { type: String, required: true }, note: String, actor: { type: Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });
const orderSchema = new Schema({
  orderNumber: { type: String, required: true, unique: true }, idempotencyKey: { type: String, required: true, unique: true },
  trackingHash: { type: String, required: true, select: false }, items: [orderItemSchema], address: { type: Schema.Types.Mixed, required: true },
  subtotal: Number, discount: Number, deliveryCharge: Number, tax: Number, total: Number, currency: { type: String, default: 'LKR' },
  paymentMethod: { type: String, enum: ['cod', 'bank_transfer'] }, channel: { type: String, enum: ['web', 'whatsapp', 'phone', 'in_person'] },
  lifecycle: { type: String, enum: ['pending_confirmation', 'confirmed', 'completed', 'cancelled'], default: 'pending_confirmation', index: true },
  paymentState: { type: String, enum: ['unpaid', 'pending_verification', 'paid', 'failed', 'partially_refunded', 'refunded'], default: 'unpaid', index: true },
  fulfilmentState: { type: String, enum: ['unfulfilled', 'packing', 'dispatched', 'delivered', 'return_requested', 'returned'], default: 'unfulfilled', index: true },
  reservationExpiresAt: { type: Date, index: true }, reservationReleasedAt: Date, dispatchedAt: Date, cancelledAt: Date,
  timeline: [orderTimelineSchema]
}, { timestamps: true });
orderSchema.index({ reservationExpiresAt: 1, lifecycle: 1, paymentState: 1 });
export const Order: Model<any> = (mongoose.models.Order as Model<any>) || mongoose.model<any>('Order', orderSchema);

const reservationSchema = new Schema({
  order: { type: Schema.Types.ObjectId, ref: 'Order', required: true }, variant: { type: Schema.Types.ObjectId, ref: 'Variant', required: true },
  quantity: { type: Number, required: true }, state: { type: String, enum: ['active', 'released', 'dispatched'], default: 'active' }, expiresAt: { type: Date, index: true }
}, { timestamps: true });
reservationSchema.index({ order: 1, variant: 1 }, { unique: true });
export const Reservation: Model<any> = (mongoose.models.Reservation as Model<any>) || mongoose.model<any>('Reservation', reservationSchema);

const userSchema = new Schema({
  name: { type: String, required: true }, email: { type: String, required: true, unique: true, lowercase: true }, passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['owner', 'manager', 'staff'], required: true }, permissions: [{ type: String }], active: { type: Boolean, default: true }, passwordChangedAt: Date
}, { timestamps: true });
export const User: Model<any> = (mongoose.models.User as Model<any>) || mongoose.model<any>('User', userSchema);

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true, select: false }, user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  csrfToken: { type: String, required: true, select: false }, expiresAt: { type: Date, required: true, expires: 0 }, lastSeenAt: Date, ipHash: String
}, { timestamps: true });
export const Session: Model<any> = (mongoose.models.Session as Model<any>) || mongoose.model<any>('Session', sessionSchema);

const settingSchema = new Schema({ key: { type: String, unique: true }, value: Schema.Types.Mixed }, { timestamps: true });
export const Setting: Model<any> = (mongoose.models.Setting as Model<any>) || mongoose.model<any>('Setting', settingSchema);

const zoneSchema = new Schema({ name: String, districts: [String], fee: { type: Number, min: 0 }, freeAbove: { type: Number, min: 0 }, codEnabled: Boolean, estimate: String, active: Boolean }, { timestamps: true });
export const DeliveryZone: Model<any> = (mongoose.models.DeliveryZone as Model<any>) || mongoose.model<any>('DeliveryZone', zoneSchema);

const couponSchema = new Schema({
  code: { type: String, unique: true, uppercase: true }, type: { type: String, enum: ['fixed', 'percent'] }, value: { type: Number, min: 0 },
  minimumSpend: { type: Number, default: 0 }, startsAt: Date, endsAt: Date, usageLimit: Number, usedCount: { type: Number, default: 0 }, active: Boolean
}, { timestamps: true });
export const Coupon: Model<any> = (mongoose.models.Coupon as Model<any>) || mongoose.model<any>('Coupon', couponSchema);

const returnSchema = new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order', index: true }, items: [{ variantId: Schema.Types.ObjectId, requested: Number, received: Number, sellable: Number, damaged: Number }], reason: String, status: String, refundAmount: Number, refundStatus: String, notes: String }, { timestamps: true });
export const ReturnRequest: Model<any> = (mongoose.models.ReturnRequest as Model<any>) || mongoose.model<any>('Return', returnSchema);

const genericSchemas = {
  Payment: new Schema({ order: { type: Schema.Types.ObjectId, ref: 'Order', index: true }, amount: Number, method: String, status: String, providerReference: String, eventKey: { type: String, unique: true, sparse: true } }, { timestamps: true }),
  Enquiry: new Schema({ name: String, email: String, mobile: String, message: String, status: { type: String, default: 'new' } }, { timestamps: true }),
  Notification: new Schema({ type: String, recipient: Schema.Types.ObjectId, payload: Schema.Types.Mixed, status: { type: String, default: 'pending' }, attempts: { type: Number, default: 0 }, nextAttemptAt: Date }, { timestamps: true }),
  Job: new Schema({ type: String, key: { type: String, unique: true }, payload: Schema.Types.Mixed, status: String, lockedAt: Date, attempts: Number, runAt: Date }, { timestamps: true }),
  AuditEvent: new Schema({ actor: Schema.Types.ObjectId, action: String, entity: String, entityId: String, metadata: Schema.Types.Mixed, ipHash: String }, { timestamps: true }),
  Content: new Schema({ key: { type: String, unique: true }, title: String, body: String, status: { type: String, enum: ['draft', 'published'], default: 'draft' } }, { timestamps: true })
};
export const Payment: Model<any> = (mongoose.models.Payment as Model<any>) || mongoose.model<any>('Payment', genericSchemas.Payment);
export const Enquiry: Model<any> = (mongoose.models.Enquiry as Model<any>) || mongoose.model<any>('Enquiry', genericSchemas.Enquiry);
export const Notification: Model<any> = (mongoose.models.Notification as Model<any>) || mongoose.model<any>('Notification', genericSchemas.Notification);
export const Job: Model<any> = (mongoose.models.Job as Model<any>) || mongoose.model<any>('Job', genericSchemas.Job);
export const AuditEvent: Model<any> = (mongoose.models.AuditEvent as Model<any>) || mongoose.model<any>('AuditEvent', genericSchemas.AuditEvent);
export const Content: Model<any> = (mongoose.models.Content as Model<any>) || mongoose.model<any>('Content', genericSchemas.Content);
