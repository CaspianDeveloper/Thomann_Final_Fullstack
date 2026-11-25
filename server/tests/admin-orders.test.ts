import request from "supertest";
import { beforeEach , describe , expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { 
    addToCart,
    bearer,
    createAdmin,
    makeProduct,
    placeOrder,
    registerUser,
    resetDb }
from "./helpers";

beforeEach(resetDb);

async function orderFor(email: string, product: { id: number }, quantity = 1) {
    const user = await registerUser(email);
    await addToCart(user.token, product.id, quantity);
    const res = await placeOrder(user.token);
    expect(res.status).toBe(201);
    return { user, orderId: res.body.id as number };
};

const setStatus = (token: string, orderId: number, status: string) => 
    request(app).patch(`/admin/orders/${orderId}/status`).set(bearer(token)).send({ status });

describe("admin orders" , () => {
    it("returns 401 without a token and 403 for a USER" , async () => {
        const user = await registerUser();
        const anonymous = await request(app).get("/admin/orders");
        const asUser = await request(app).get("/admin/orders").set(bearer(user.token));
        const patchAsUser = await request(app)
            .patch("/admin/orders/1/status")
            .set(bearer(user.token))
            .send({ status: "PAID" });
        expect(anonymous.status).toBe(401);
        expect(asUser.status).toBe(403);
        expect(patchAsUser.status).toBe(403);
    });

    it("a user seen only their own orders, admin sees all with pagination" , async () => {
        const product = await makeProduct({ stock: 10 });
        const a = await orderFor("a@test.com", product);
        await orderFor("b@test.com" , product);
        const admin = await createAdmin();

        const mine = await request(app).get("/orders").set(bearer(a.user.token));
        expect(mine.status).toBe(200);
        expect(mine.body.items).toHaveLength(1);
        expect(mine.body.total).toBe(1);

        const all = await request(app).get("/admin/orders?limit=1&page=1").set(bearer(admin.token));
        expect(all.status).toBe(200);
        expect(all.body.items).toHaveLength(1);
        expect(all.body.total).toBe(2);
        expect(all.body.totalPages).toBe(2);
        expect(all.body.items[0].user.email).toBeDefined();
    });

    it("filters admin orders by status and userId" , async () => {
        const product = await makeProduct({ stock: 10 });
        const a = await orderFor("a@test.com", product);
        const b = await orderFor("b@test.com" , product);
        const admin = await createAdmin();
        await setStatus(admin.token, a.orderId, "PAID");

        const paid = await request(app).get("/admin/orders?status=PAID").set(bearer(admin.token));
        expect(paid.body.items.map((o: any) => o.id)).toEqual([a.orderId]);

        const ofb = await request(app).get(`/admin/orders?userId=${b.user.id}`).set(bearer(admin.token));
        expect(ofb.body.items.map((o: any) => o.id)).toEqual([b.orderId]);
    });

    it("moves forward only: PENDING -> PAID -> SHIPPED -> DELIVERED, never back (rule 6)", async () => {
        const product = await makeProduct();
        const { user, orderId } = await orderFor("a@test.com" , product);
        const admin = await createAdmin();

        for (const status of ["PAID" , "SHIPPED" , "DELIVERED"]) {
            const res = await setStatus(admin.token, orderId, status);
            expect(res.status).toBe(200);
            expect(res.body.status).toBe(status);
        };

        const back = await setStatus(admin.token, orderId, "PAID");
        const cancel = await setStatus(admin.token, orderId, "CANCELED");
        expect(back.status).toBe(409);
        expect(cancel.status).toBe(409);

        const userCancel = await request(app).post(`/orders/${orderId}/cancel`).set(bearer(user.token));
        expect(userCancel.status).toBe(409);
    });


    it("a user cannot cancel an order that is already PAID (rule 6)" , async () => {
        const product = await makeProduct({ stock: 5 });
        const { user, orderId } = await orderFor("a@test.com" , product, 2);
        const admin = await createAdmin();
        await setStatus(admin.token, orderId, "PAID");

        const res = await request(app).post(`/orders/${orderId}/cancel`).set(bearer(user.token));
        expect(res.status).toBe(409);

        const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
        expect(after.stock).toBe(3);
    });

    it("admin cancel restores stock exactly once (rule 6)" , async () => {
        const product = await makeProduct({ stock: 5 });
        const { orderId } = await orderFor("a@test.com" , product, 2);
        const admin = await createAdmin();

        const first = await setStatus(admin.token, orderId, "CANCELED");
        const second = await setStatus(admin.token, orderId, "CANCELED");
        expect(first.status).toBe(200);
        expect(second.status).toBe(409);

        const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
        expect(after.stock).toBe(5);
    });

    it("rejects an unknown status with 400 and a missing order with 404", async () => {
        const product = await makeProduct();
        const { orderId } = await orderFor("a@test.com" , product);
        const admin = await createAdmin();

        const bad = await setStatus(admin.token, orderId, "BANANA");
        const missing = await setStatus(admin.token, 99999, "PAID");
        expect(bad.status).toBe(400);
        expect(missing.status).toBe(404);
    });

    it("ignores client prices: sending total or items in POST /orders gives 400 (rule 2)" , async () => {
        const product = await makeProduct({ price: 100 });
        const user = await registerUser();
        await addToCart(user.token, product.id, 1);

        const res = await request(app)
            .post("/orders")
            .set(bearer(user.token))
            .send({ total: 1, items: [{ productId: product.id, unitPrice: 1 }] });
        expect(res.status).toBe(400);
        expect(await prisma.order.count()).toBe(0);
    });
});