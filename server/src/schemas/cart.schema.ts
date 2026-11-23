import { z } from "zod";

export const addCartItemSchema = z.strictObject({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(100).default(1),
});

export const updateCartItemSchema = z.strictObject({
    quantity: z.number().int().min(1).max(100),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;