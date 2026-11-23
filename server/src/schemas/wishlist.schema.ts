import { z } from "zod";

export const addWishlistItemSchema = z.strictObject({
    productId: z.number().int().positive(),
});

