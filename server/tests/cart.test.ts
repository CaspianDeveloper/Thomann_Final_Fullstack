import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { addToCart, bearer, makeProduct, registerUser, resetDb } from "./helpers";

beforeEach(resetDb);

describe("cart and wishlist (rules 3, 4, 5)" , () => {
    it("adding an existing product increases quantity: 201 then 200, one row (rule 3)", async () => {
        const product = await makeProduct({ stock: 10 });
        const user = await registerUser();
        
        const first = await request(app).post("/cart/items").set(bearer(user.token)).send({ productId: product.id, quantity: 1 });
        const second = await request(app).post("/cart/items").set(bearer(user.token)).send({ productId: product.id, quantity: 1 });
        expect(first.status).toBe(201);
        expect(second.status).toBe(200);

        const rows = await prisma.cartItem.findMany();
        expect(rows).toHaveLength(1);
        expect(rows[0]?.quantity).toBe(2);
    });

    it("rejects quantity 0 with 400 (rule 3)" , async () => {
        const product = await makeProduct();
        const user = await registerUser();
        const res = await request(app).post("/cart/items").set(bearer(user.token)).send({ productId: product.id, quantity: 0 });
        expect(res.status).toBe(400);
    });

    it("rejects quantity above stock with 409 (rule 3)", async () => {
        const product = await makeProduct({ stock: 2 });
        const user = await registerUser();
        const res = await request(app).post("/cart/items").set(bearer(user.token)).send({ productId: product.id, quantity: 3 });
        expect(res.status).toBe(409);
        expect(await prisma.cartItem.count()).toBe(0);
    });

    it("returns 404 when adding an inactive product (rule 5)" , async () => {
        const product = await makeProduct({ isActive: false });
        const user = await registerUser();
        const res = await request(app).post("/cart/items").set(bearer(user.token)).send({ productId: product.id, quantity: 1 });
        expect(res.status).toBe(404);
    });

    it("another user cannot change or delete my cart item: 404 (rule 4)", async () => {
        const product = await makeProduct();
        const owner = await registerUser("owner@test.com");
        const other = await registerUser("other@test.com");
        await addToCart(owner.token, product.id, 1);

        const patch = await request(app).patch(`/cart/items/${product.id}`).set(bearer(other.token)).send({ quantity: 5 });
        const del = await request(app).delete(`/cart/items/${product.id}`).set(bearer(other.token));
        expect(patch.status).toBe(404);
        expect(del.status).toBe(404);

        const row = await prisma.cartItem.findFirstOrThrow();
        expect(row.quantity).toBe(1);
    });

    it("wishlist has no duplicates: 201 then 200, one row (rule 3)" , async () => {
        const product = await makeProduct();
        const user = await registerUser();

        const first = await request(app).post("/wishlist").set(bearer(user.token)).send({ productId: product.id });
        const second = await request(app).post("/wishlist").set(bearer(user.token)).send({ productId: product.id });
        expect(first.status).toBe(201);
        expect(second.status).toBe(200);
        expect(await prisma.wishlistItem.count()).toBe(1);
    });
});

