import { z } from "zod";

export const orderStatusEnum = z.enum(["PENDING" , "PAID" , "SHIPPED" , "DELIVERED" , "CANCELED"]);

export const shippingAddressSchema = z.strictObject({
    streetNum: z.string().trim().min(1).max(200),
    postalCode: z.string().trim().min(1).max(20),
    town: z.string().trim().min(1).max(20),
    country: z.string().trim().min(1).max(100),
});

// shippingAddress verilməsə, istifadəçinin profil ünvanı götürülür.
export const createOrderSchema = z.strictObject({
    shippingAddress: shippingAddressSchema.optional(),
});

export const listOrdersQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    status: orderStatusEnum.optional(),
    sort: z.enum(["newest" , "oldest" , "total_asc", "total_desc"]).default("newest"),
});

export const adminListOrdersQuerySchema = listOrdersQuerySchema.extend({
    userId: z.coerce.number().int().positive().optional(),
});

export const updateOrderStatusSchema = z.strictObject({
    status: orderStatusEnum,
});

export type AdminListOrdersQuery = z.infer<typeof adminListOrdersQuerySchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;