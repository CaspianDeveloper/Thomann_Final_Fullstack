import { z } from "zod";

export const idParamSchema = z.strictObject({
    id: z.coerce.number().int().positive(),
});

export const listProductsQuerySchema = z
    .strictObject({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(12),
        search: z.string().trim().min(1).optional(),
        category: z.string().trim().min(1).optional(), // kateqoriyanın slugı
        brand: z.string().trim().min(1).optional(),
        minPrice: z.coerce.number().min(0).optional(),
        maxPrice: z.coerce.number().min(0).optional(),
        sort : z
            .enum(["newest" , "price_asc" , "price_desc" , "name_asc" , "rating_desc"])
            .default("newest"),
    })
    .refine(
        (q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, 
        {message: "minPrice must be <= maxPrice" , path: ["minPrice"]},
    );

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;