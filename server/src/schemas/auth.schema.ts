import { email, z } from "zod";

export const registerSchema = z.strictObject({
    email: z.email().transform((s) => s.trim().toLowerCase()),
    password: z.string().min(8).max(128),
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    company: z.string().trim().optional(),
    streetNum: z.string().trim().min(1),
    postalCode: z.string().trim().min(1),
    town: z.string().trim().min(1),
    country: z.string().trim().min(1),
});

export const loginSchema = z.strictObject({
    email: z.email().transform((s) => s.trim().toLowerCase()),
    password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;