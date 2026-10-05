import { useEffect, useState } from 'react';

export type CartLine = { variantId: string; productName: string; slug: string; sku: string; options: Record<string, string>; price: number; quantity: number; image?: string };
const CART_KEY = 'clothing-store-cart-v1';

export function readCart(): CartLine[] {
  if (typeof localStorage === 'undefined') return [];
  try { const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
export function writeCart(lines: CartLine[]) { localStorage.setItem(CART_KEY, JSON.stringify(lines)); window.dispatchEvent(new Event('cart-change')); }
export function addCart(line: CartLine) { const lines = readCart(); const current = lines.find(l => l.variantId === line.variantId); if (current) current.quantity += line.quantity; else lines.push(line); writeCart(lines); }
export function useCart() { const [cart, setCart] = useState<CartLine[]>([]); useEffect(() => { const sync = () => setCart(readCart()); sync(); addEventListener('cart-change', sync); return () => removeEventListener('cart-change', sync); }, []); return [cart, writeCart] as const; }

const WISH_KEY = 'clothing-store-wishlist-v1';
export function toggleWish(slug: string) { const list: string[] = JSON.parse(localStorage.getItem(WISH_KEY) || '[]'); localStorage.setItem(WISH_KEY, JSON.stringify(list.includes(slug) ? list.filter(s => s !== slug) : [...list, slug])); }
