import { z } from 'zod';

export const money = z.number().int().nonnegative();
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');

export const addressSchema = z.object({
  name: z.string().trim().min(2).max(100),
  mobile: z.string().trim().regex(/^\+?[0-9]{9,15}$/),
  email: z.email().optional().or(z.literal('')),
  line1: z.string().trim().min(5).max(160),
  line2: z.string().trim().max(160).optional(),
  district: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  postalCode: z.string().trim().max(20).optional(),
  instructions: z.string().trim().max(500).optional()
}).strict();

export const checkoutSchema = z.object({
  items: z.array(z.object({ variantId: objectId, quantity: z.number().int().min(1).max(20) }).strict()).min(1).max(50),
  address: addressSchema,
  paymentMethod: z.enum(['cod', 'bank_transfer']),
  couponCode: z.string().trim().toUpperCase().max(40).optional(),
  deliveryZoneId: objectId.optional(),
  channel: z.enum(['web', 'whatsapp']).default('web')
}).strict();

export const loginSchema = z.object({ email: z.email(), password: z.string().min(10).max(128) }).strict();

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type PublicProduct = {
  id: string; name: string; slug: string; description: string; category?: { name: string; slug: string };
  images: Array<{ url: string; alt: string; focalX?: number; focalY?: number }>;
  variants: Array<{ id: string; sku: string; options: Record<string, string>; price: number; salePrice?: number; available: number; status: string }>;
  tags: string[]; material?: string; fit?: string; care?: string; featured: boolean;
};

export function formatLkr(minor: number) {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(minor / 100);
}
