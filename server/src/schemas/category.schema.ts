import { z } from "zod";

export const createCategorySchema = z.strictObject({
    name: z.string().trim().min(1).max(100),
    imageUrl: z.url().optional(),
});

export const updateCategorySchema = z 
    .strictObject({
        name: z.string().trim().min(1).max(100),
        imageUrl: z.url().nullable(),
    })
    .partial()
    .refine((o) => Object.keys(o).length > 0, { message: "At least one filed is required" });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;