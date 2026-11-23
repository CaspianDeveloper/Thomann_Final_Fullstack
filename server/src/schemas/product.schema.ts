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

const specsSchema = z.record(z.string() , z.union([z.string() , z.number() , z.boolean()]));

export const createProductSchema = z.strictObject({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1),
    brand: z.string().trim().min(1).max(100),
    subcategory: z.string().trim().min(1).nullable().optional(),
    price: z.number().min(0).max(99999999),
    currency: z.string().trim().length(3).transform((s) => s.toUpperCase()).default("USD"),
    stock: z.number().int().min(0).default(0),
    image: z.url(),
    images: z.array(z.url()).max(10).default([]),
    brandImg: z.url().nullable().optional(),
    specs: specsSchema.default({}),
    categoryId: z.number().int().positive(),
    isActive: z.boolean().default(true)
});


export const updateProductSchema = z    
    .strictObject({
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1),
        brand: z.string().trim().min(1).max(100),
        subcategory: z.string().trim().min(1).nullable(),
        price: z.number().min(0).max(99999999),
        currency: z.string().trim().length(3).transform((s) => s.toUpperCase()),
        stock: z.number().int().min(0),
        image: z.url(),
        images: z.array(z.url().max(10)),
        brandImg: z.url().nullable(),
        specs: specsSchema,
        categoryId: z.number().int().positive(),
        isActive: z.boolean(),
    })
    .partial()
    .refine((o) => Object.keys(o).length > 0 , { message: "At least one field is required" });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;