import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import type { CheckoutInput } from '../../shared/contracts.js';
import { config } from '../config.js';
import { Coupon, DeliveryZone, Notification, Order, Product, Variant } from '../models.js';
import { dispatchStock, releaseStock, reserveStock } from './inventory.js';

export function activePrice(v: { price: number; salePrice?: number | null; saleStart?: Date | null; saleEnd?: Date | null }, now = new Date()) {
  const saleActive = v.salePrice != null && (!v.saleStart || v.saleStart <= now) && (!v.saleEnd || v.saleEnd >= now);
  return saleActive ? v.salePrice! : v.price;
}

function trackingHash(secret: string) { return createHash('sha256').update(`${config.TRACKING_PEPPER}:${secret}`).digest('hex'); }
function orderNumber() { return `CS-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(4).toString('hex').toUpperCase()}`; }

export async function placeOrder(input: CheckoutInput, idempotencyKey: string) {
  const existing = await Order.findOne({ idempotencyKey });
  if (existing) return { order: existing, trackingToken: undefined, replayed: true };
  const trackingToken = randomBytes(32).toString('base64url');
  const session = await mongoose.startSession();
  let saved: any;
  try {
    await session.withTransaction(async () => {
      const variants = await Variant.find({ _id: { $in: input.items.map(i => i.variantId) }, active: true }).session(session);
      if (variants.length !== new Set(input.items.map(i => i.variantId)).size) throw Object.assign(new Error('One or more variants are unavailable'), { status: 409, code: 'VARIANT_UNAVAILABLE' });
      const products = await Product.find({ _id: { $in: variants.map(v => v.product) }, status: 'published' }).session(session);
      const productMap = new Map(products.map(p => [String(p._id), p]));
      const variantMap = new Map(variants.map(v => [String(v._id), v]));
      const lineItems = input.items.map(item => {
        const variant = variantMap.get(item.variantId); const product = variant && productMap.get(String(variant.product));
        if (!variant || !product) throw Object.assign(new Error('A product is no longer available'), { status: 409, code: 'PRODUCT_UNAVAILABLE' });
        const unitPrice = activePrice(variant);
        return { productId: product._id, variantId: variant._id, productName: product.name, slug: product.slug, sku: variant.sku,
          options: variant.options instanceof Map ? Object.fromEntries(variant.options) : variant.options, unitPrice, quantity: item.quantity, lineTotal: unitPrice * item.quantity, image: variant.images[0]?.url || product.images[0]?.url };
      });
      const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
      let discount = 0;
      if (input.couponCode) {
        const coupon = await Coupon.findOne({ code: input.couponCode, active: true, minimumSpend: { $lte: subtotal }, $and: [{ $or: [{ startsAt: null }, { startsAt: { $lte: new Date() } }] }, { $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }] }] }).session(session);
        if (!coupon || (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)) throw Object.assign(new Error('Coupon is invalid or exhausted'), { status: 422, code: 'COUPON_INVALID' });
        discount = coupon.type === 'percent' ? Math.floor(subtotal * Math.min(coupon.value, 100) / 100) : Math.min(coupon.value, subtotal);
        const updated = await Coupon.updateOne({ _id: coupon._id, $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] }, { $inc: { usedCount: 1 } }, { session });
        if (!updated.modifiedCount) throw Object.assign(new Error('Coupon is exhausted'), { status: 409, code: 'COUPON_EXHAUSTED' });
      }
      let deliveryCharge = 0;
      if (input.deliveryZoneId) {
        const zone = await DeliveryZone.findOne({ _id: input.deliveryZoneId, active: true }).session(session);
        if (!zone || !zone.districts.some((d: string) => d.toLowerCase() === input.address.district.toLowerCase())) throw Object.assign(new Error('Selected delivery zone is not valid for this district'), { status: 422, code: 'DELIVERY_ZONE_INVALID' });
        if (input.paymentMethod === 'cod' && !zone.codEnabled) throw Object.assign(new Error('Cash on delivery is not available in this zone'), { status: 422, code: 'COD_UNAVAILABLE' });
        deliveryCharge = zone.freeAbove && subtotal - discount >= zone.freeAbove ? 0 : zone.fee;
      }
      const expiresAt = new Date(Date.now() + config.RESERVATION_MINUTES * 60_000);
      const [order] = await Order.create([{ orderNumber: orderNumber(), idempotencyKey, trackingHash: trackingHash(trackingToken), items: lineItems, address: input.address,
        subtotal, discount, deliveryCharge, tax: 0, total: subtotal - discount + deliveryCharge, paymentMethod: input.paymentMethod, channel: input.channel,
        paymentState: input.paymentMethod === 'bank_transfer' ? 'pending_verification' : 'unpaid', reservationExpiresAt: expiresAt,
        timeline: [{ type: 'placed', note: 'Order placed and stock reserved' }] }], { session });
      for (const item of lineItems) await reserveStock(String(item.variantId), item.sku, item.quantity, expiresAt, { order: String(order._id), reason: 'Order placement', operationKey: `order:${order._id}:reserve:${item.variantId}` }, session);
      await Notification.create([{ type: 'new_order', payload: { orderId: order._id, orderNumber: order.orderNumber }, status: 'pending', nextAttemptAt: new Date() }], { session });
      saved = order;
    });
  } catch (error: any) {
    if (error?.code === 11000) { const original = await Order.findOne({ idempotencyKey }); if (original) return { order: original, trackingToken: undefined, replayed: true }; }
    throw error;
  } finally { await session.endSession(); }
  return { order: saved, trackingToken, replayed: false };
}

export async function transitionOrder(orderId: string, action: 'confirm' | 'pack' | 'dispatch' | 'deliver' | 'cancel', actor: string, reason = '') {
  const session = await mongoose.startSession();
  const actorId = mongoose.isValidObjectId(actor) ? actor : undefined;
  let result: any;
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw Object.assign(new Error('Order not found'), { status: 404, code: 'NOT_FOUND' });
      if (action === 'confirm' && order.lifecycle === 'pending_confirmation') order.lifecycle = 'confirmed';
      else if (action === 'pack' && order.lifecycle === 'confirmed' && order.fulfilmentState === 'unfulfilled') order.fulfilmentState = 'packing';
      else if (action === 'dispatch' && ['confirmed'].includes(order.lifecycle) && ['unfulfilled', 'packing'].includes(order.fulfilmentState)) {
        for (const item of order.items) await dispatchStock(String(item.variantId), item.sku, item.quantity, { order: String(order._id), ...(actorId ? { actor: actorId } : {}), reason: 'Order dispatch', operationKey: `order:${order._id}:dispatch:${item.variantId}` }, session);
        order.fulfilmentState = 'dispatched'; order.dispatchedAt = new Date();
      } else if (action === 'deliver' && order.fulfilmentState === 'dispatched') { order.fulfilmentState = 'delivered'; order.lifecycle = 'completed'; }
      else if (action === 'cancel' && order.lifecycle !== 'completed' && order.fulfilmentState !== 'dispatched') {
        for (const item of order.items) await releaseStock(String(item.variantId), item.sku, item.quantity, { order: String(order._id), ...(actorId ? { actor: actorId } : {}), reason: reason || 'Order cancelled', operationKey: `order:${order._id}:cancel:${item.variantId}` }, session);
        order.lifecycle = 'cancelled'; order.cancelledAt = new Date(); order.reservationReleasedAt = new Date();
      } else if ((action === 'confirm' && order.lifecycle === 'confirmed') || (action === 'dispatch' && order.fulfilmentState === 'dispatched') || (action === 'cancel' && order.lifecycle === 'cancelled')) return;
      else throw Object.assign(new Error(`Transition '${action}' is not allowed from the current state`), { status: 409, code: 'INVALID_TRANSITION' });
      order.timeline.push({ type: action, note: reason, ...(actorId ? { actor: actorId } : {}) });
      await order.save({ session }); result = order;
    });
  } finally { await session.endSession(); }
  return result || Order.findById(orderId);
}

export async function findTrackedOrder(orderNumber: string, trackingToken: string) {
  return Order.findOne({ orderNumber, trackingHash: trackingHash(trackingToken) }).select('-address.email -address.instructions -idempotencyKey -timeline.actor');
}

export async function expireReservations(limit = 50) {
  const candidates = await Order.find({ lifecycle: 'pending_confirmation', paymentState: { $nin: ['paid'] }, fulfilmentState: 'unfulfilled', reservationExpiresAt: { $lte: new Date() }, reservationReleasedAt: null }).limit(limit);
  let count = 0;
  for (const order of candidates) { try { await transitionOrder(String(order._id), 'cancel', 'system', 'Reservation expired'); count++; } catch { /* retry next durable worker pass */ } }
  return count;
}
