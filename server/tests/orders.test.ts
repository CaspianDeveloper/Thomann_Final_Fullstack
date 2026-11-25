import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { 
    addToCart,
    bearer,
    createAdmin,
    makeProduct,
    placeOrder,
    registerUser,
    resetDb 
} from "./helpers.js";

beforeEach(resetDb);

describe("orders" , () => {
    it("rejects an order from an empty cart with 400 (rule 7)" , async () => {
        const user = await registerUser();
        const res = await placeOrder(user.token);
        expect(res.status).toBe(400);
    });

    it("creates an order, decrements stock and clears the cart" , async () => {
        const product = await makeProduct({ stock: 10, price: 100 });
        const user = await registerUser();
        await addToCart(user.token, product.id, 2);

        const res = await placeOrder(user.token);
        expect(res.status).toBe(201);
        expect(res.body.status).toBe("PENDING");
        expect(res.body.total).toBe(200);

        const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
        expect(after.stock).toBe(8);
        expect(await prisma.cartItem.count()).toBe(0);
    });

    it("keeps the old price on an existing order after a price change (rule 2)" , async () => {
        const product = await makeProduct({ price: 100 });
        const user = await registerUser();
        await addToCart(user.token , product.id, 2);
        const order = await placeOrder(user.token);

        await prisma.product.update({ where: { id: product.id } , data: { price: 150 } });

        const res = (await request(app).get(`/orders/${order.body.id}`).set(bearer(user.token)));
        expect(res.status).toBe(200);
        expect(res.body.items[0].unitPrice).toBe(100);
        expect(res.body.total).toBe(200);
    });

    it("returns 409 and changes nothing when stock is insufficient (rule 1)", async () => {
        const product = await makeProduct({ stock: 5 });
        const user = await registerUser();
        await addToCart(user.token , product.id , 3);
        await prisma.product.update({ where: { id: product.id }, data: { stock: 1 } });

        const res = await placeOrder(user.token);
        expect(res.status).toBe(409);

        const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
        expect(after.stock).toBe(1);
        expect(await prisma.cartItem.count()).toBe(1);
        expect(await prisma.order.count()).toBe(0);
    });

    it("never oversells: 6 parallel orders for 3 items -> exactly 3 succeed (rule 1)" , async () => {
        const product = await makeProduct({ stock: 3 });
        const users = [];
        for (let i = 1; i <= 6; i++) {
            const u = await registerUser(`u${i}@test.com`);
            await addToCart(u.token, product.id, 1);
            users.push(u);
        };

        const results = await Promise.all(users.map((u) => placeOrder(u.token)));
        const statuses = results.map((r) => r.status);

        expect(statuses.filter((s) => s === 201)).toHaveLength(3);
        expect(statuses.filter((s) => s === 409)).toHaveLength(3);

        const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
        expect(after.stock).toBe(0);
        expect(await prisma.order.count()).toBe(3);
    });

    it("returns 404 when another user reads or cancels an order (rule 4)" , async () => {
        const product = await makeProduct();
        const owner = await registerUser("owner@test.com");
        const other = await registerUser("other@test.com");
        await addToCart(owner.token, product.id, 1);
        const order = await placeOrder(owner.token);

        const read = await request(app).get(`/orders/${order.body.id}`).set(bearer(other.token));
        const cancel = await request(app).post(`/orders/${order.body.id}/cancel`).set(bearer(other.token));
        expect(read.status).toBe(404);
        expect(cancel.status).toBe(404);
    });

    it("cancelling restores stock exactly once (rule 6)", async () => {
        const product = await makeProduct({ stock: 5 });
        const user = await registerUser();
        await addToCart(user.token, product.id, 2);
        const order = await placeOrder(user.token);

        const first = await request(app).post(`/orders/${order.body.id}/cancel`).set(bearer(user.token));
        const second = await request(app).post(`/orders/${order.body.id}/cancel`).set(bearer(user.token));
        expect(first.status).toBe(200);
        expect(first.body.status).toBe("CANCELED");
        expect(second.status).toBe(409);

        const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
        expect(after.stock).toBe(5);
    });

    it("rejects an illegal status jump (PENDING -> SHIPPED) with 409 (rule 6)", async () => {
        const product = await makeProduct();
        const user = await registerUser();
        const admin = await createAdmin();
        await addToCart(user.token, product.id, 1);
        const order = await placeOrder(user.token);

        const jump = await request(app)
            .patch(`/admin/orders/${order.body.id}/status`)
            .set(bearer(admin.token))
            .send({ status: "SHIPPED" });
         expect(jump.status).toBe(409);

         const ok = await request(app)
            .patch(`/admin/orders/${order.body.id}/status`)
            .set(bearer(admin.token))
            .send({ status: "PAID" })
         expect(ok.status).toBe(200);
    });
});

