import request from "supertest";
import argon2 from "argon2";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

export const PASSWORD = "password123";

export const bearer  = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function resetDb() {
    await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "OrderItem" , "Order" , "CartItem" , "WishlistItem" , "Product" , "Category" , "User"  RESTART IDENTITY CASCADE`,
    );
};

export const validUser = (email = "user@test.com") => ({
    email,
    password: PASSWORD,
    firstName: "Test",
    lastName: "User",
    streetNum: "Main St 1",
    postalCode: "1000",
    town: "Baku",
    country: "AZ",
});

async function loginToken(email: string) {
    const res = await request(app).post("/auth/login").send({ email, password: PASSWORD });

    if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
    return res.body.token as string;
};

export async function registerUser(email = "user@test.com") {
    const res = await request(app).post("/auth/register").send(validUser(email));
    if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    return { id: user.id, token: await loginToken(email) };
};

export async function createAdmin(email = "admin@test.com") {
    await prisma.user.create({
        data: {
            email,
            passwordHash: await argon2.hash(PASSWORD),
            role: "ADMIN",
            firstName: "Admin",
            lastName: "Admin",
            streetNum: "Admin St 1",
            postalCode: "1000",
            town: "Baku",
            country: "AZ",
        },
    });
    return { token: await loginToken(email) };
};


export async function makeProduct(opts: { stock?: number; price?: number; isActive?: boolean } = {}) {
    const category = await prisma.category.upsert({
        where: { slug: "test-cat" },
        update: {},
        create: { name: "Test Cat" , slug: "test-cat" },
    });

    return prisma.product.create({
        data: { 
            name: "Test Product",
            description: "desc",
            brand: "Brand",
            price: opts.price ?? 100,
            stock: opts.stock ?? 10,
            image: "https://example.com/a.jpg",
            categoryId: category.id,
            isActive: opts.isActive ?? true,
        },
    });
};

export async function addToCart(token: string, productId: number, quantity = 1) {
    const res = await request(app).post("/cart/items").set(bearer(token)).send({ productId, quantity });
    if (res.status !== 201 && res.status !== 200) {
        throw new Error(`addToCart failed: ${res.status} ${JSON.stringify(res.body)}`);
    };
};

export async function placeOrder(token: string) {
    return request(app).post("/orders").set(bearer(token));
};

