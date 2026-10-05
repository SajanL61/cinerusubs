import { describe, expect, it } from 'vitest';
import { inventoryState } from '../server/services/inventory';
import { activePrice } from '../server/services/orders';

describe('inventory invariants', () => {
  it('matches the required reserve, confirm, dispatch example', () => {
    const start = inventoryState(10, 0); expect(start).toEqual({ onHand: 10, reserved: 0, available: 10 });
    const reserved = inventoryState(start.onHand, start.reserved + 2); expect(reserved).toEqual({ onHand: 10, reserved: 2, available: 8 });
    const confirmed = inventoryState(reserved.onHand, reserved.reserved); expect(confirmed).toEqual(reserved);
    const dispatched = inventoryState(confirmed.onHand - 2, confirmed.reserved - 2); expect(dispatched).toEqual({ onHand: 8, reserved: 0, available: 8 });
  });
  it('releases cancellation without increasing on-hand', () => {
    const reserved = inventoryState(10, 2); const cancelled = inventoryState(reserved.onHand, reserved.reserved - 2);
    expect(cancelled).toEqual({ onHand: 10, reserved: 0, available: 10 });
  });
  it('restocks only the received sellable part of a return', () => {
    const dispatched = inventoryState(8, 0); const returned = inventoryState(dispatched.onHand + 1, 0);
    expect(returned).toEqual({ onHand: 9, reserved: 0, available: 9 });
  });
  it('rejects negative and over-reserved balances', () => {
    expect(() => inventoryState(-1, 0)).toThrow(); expect(() => inventoryState(2, 3)).toThrow();
  });
});

describe('integer price selection', () => {
  it('uses a sale only inside its configured period', () => {
    const now = new Date('2026-05-10T00:00:00Z');
    expect(activePrice({ price: 500_00, salePrice: 425_00, saleStart: new Date('2026-05-01'), saleEnd: new Date('2026-05-20') }, now)).toBe(425_00);
    expect(activePrice({ price: 500_00, salePrice: 425_00, saleStart: new Date('2026-06-01') }, now)).toBe(500_00);
  });
});
