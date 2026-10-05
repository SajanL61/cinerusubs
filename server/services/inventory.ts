import type { ClientSession } from 'mongoose';
import { Inventory, InventoryMovement, Reservation } from '../models.js';

type Actor = { actor?: string; order?: string; reason: string; operationKey: string };

async function alreadyApplied(operationKey: string, session: ClientSession) {
  return Boolean(await InventoryMovement.exists({ operationKey }).session(session));
}

export async function reserveStock(variantId: string, sku: string, quantity: number, expiresAt: Date, context: Actor, session: ClientSession) {
  if (await alreadyApplied(context.operationKey, session)) return;
  const after = await Inventory.findOneAndUpdate(
    { variant: variantId, $expr: { $gte: [{ $subtract: ['$onHand', '$reserved'] }, quantity] } },
    { $inc: { reserved: quantity, version: 1 } }, { new: true, session }
  );
  if (!after) throw Object.assign(new Error(`Insufficient stock for ${sku}`), { status: 409, code: 'OUT_OF_STOCK', sku });
  const before = { onHand: after.onHand, reserved: after.reserved - quantity, damaged: after.damaged };
  await InventoryMovement.create([{ variant: variantId, sku, type: 'reservation', quantity, ...context, before, after: { onHand: after.onHand, reserved: after.reserved, damaged: after.damaged } }], { session });
  await Reservation.create([{ order: context.order, variant: variantId, quantity, expiresAt, state: 'active' }], { session });
}

export async function releaseStock(variantId: string, sku: string, quantity: number, context: Actor, session: ClientSession) {
  if (await alreadyApplied(context.operationKey, session)) return;
  const after = await Inventory.findOneAndUpdate({ variant: variantId, reserved: { $gte: quantity } }, { $inc: { reserved: -quantity, version: 1 } }, { new: true, session });
  if (!after) throw Object.assign(new Error(`Reservation mismatch for ${sku}`), { status: 409, code: 'RESERVATION_CONFLICT' });
  await InventoryMovement.create([{ variant: variantId, sku, type: 'release', quantity: -quantity, ...context,
    before: { onHand: after.onHand, reserved: after.reserved + quantity, damaged: after.damaged }, after: { onHand: after.onHand, reserved: after.reserved, damaged: after.damaged } }], { session });
  await Reservation.updateOne({ order: context.order, variant: variantId, state: 'active' }, { state: 'released' }, { session });
}

export async function dispatchStock(variantId: string, sku: string, quantity: number, context: Actor, session: ClientSession) {
  if (await alreadyApplied(context.operationKey, session)) return;
  const after = await Inventory.findOneAndUpdate({ variant: variantId, reserved: { $gte: quantity }, onHand: { $gte: quantity } }, { $inc: { onHand: -quantity, reserved: -quantity, version: 1 } }, { new: true, session });
  if (!after) throw Object.assign(new Error(`Reservation mismatch for ${sku}`), { status: 409, code: 'RESERVATION_CONFLICT' });
  await InventoryMovement.create([{ variant: variantId, sku, type: 'dispatch', quantity: -quantity, ...context,
    before: { onHand: after.onHand + quantity, reserved: after.reserved + quantity, damaged: after.damaged }, after: { onHand: after.onHand, reserved: after.reserved, damaged: after.damaged } }], { session });
  await Reservation.updateOne({ order: context.order, variant: variantId, state: 'active' }, { state: 'dispatched' }, { session });
}

export async function receiveSellableReturn(variantId: string, sku: string, quantity: number, context: Actor, session: ClientSession) {
  if (await alreadyApplied(context.operationKey, session)) return;
  const after = await Inventory.findOneAndUpdate({ variant: variantId }, { $inc: { onHand: quantity, version: 1 } }, { new: true, session });
  if (!after) throw Object.assign(new Error(`Inventory not found for ${sku}`), { status: 404, code: 'NOT_FOUND' });
  await InventoryMovement.create([{ variant: variantId, sku, type: 'return', quantity, ...context,
    before: { onHand: after.onHand - quantity, reserved: after.reserved, damaged: after.damaged }, after: { onHand: after.onHand, reserved: after.reserved, damaged: after.damaged } }], { session });
}

export function inventoryState(onHand: number, reserved: number) {
  if (onHand < 0 || reserved < 0 || reserved > onHand) throw new Error('Invalid inventory state');
  return { onHand, reserved, available: onHand - reserved };
}
