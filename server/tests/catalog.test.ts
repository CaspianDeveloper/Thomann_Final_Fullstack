import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { addToCart , bearer, createAdmin, makeProduct, placeOrder, registerUser, resetDb} from "./helpers";
import { de } from "zod/v4/locales";

beforeEach(resetDb);

const newProduct = (categoryId: number) => ({
    name: "Created Product",
    description: "desc",
    brand: "Brand",
    price: 10,
    image: "https://example.com/a.jpg",
    categoryId,
});

describe("catalog permissions and deletion (rules 5, 7)" , () => {
    it("USER gets 403 and no token gets 401 on POST /products" , async () => {
        const product = await makeProduct();
        const user = await registerUser();

        const asUser = await request(app).post("/products").set(bearer(user.token)).send(newProduct(product.categoryId));
        const anonymous = await request(app).post("/products").send(newProduct(product.categoryId));
        expect(asUser.status).toBe(403);
        expect(anonymous.status).toBe(401);
    });

    it("a category that has products cannot be deleted: 409 (rule 5)", async () => {
        const product = await makeProduct();
        const admin = await createAdmin();

        const res = await request(app).delete(`/categories/${product.categoryId}`).set(bearer(admin.token));
        expect(res.status).toBe(409);
        expect(await prisma.category.count()).toBe(1);
    });

    it("deleting an ordered product only deactivates it (rule 5)" , async () => {
        const product = await makeProduct();
        const user = await registerUser();
        const admin = await createAdmin();
        await addToCart(user.token , product.id, 1);
        const order = await placeOrder(user.token);
        expect(order.status).toBe(201);

        const del = await request(app).delete(`/products/${product.id}`).set(bearer(admin.token));
        expect(del.status).toBe(204);

        const row = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
        expect(row.isActive).toBe(false);
        expect(await prisma.orderItem.count()).toBe(1);

        const detail = await request(app).get(`/products/${product.id}`);
        expect(detail.status).toBe(404);

        const list = await request(app).get("/products");
        expect(JSON.stringify(list.body)).not.toContain("Ordered Guitar");
    });

    it("an inactive product in the cart blocks the order with 409 (rule 7)" , async  () => {
        const product = await makeProduct({ stock: 5 });
        const user = await registerUser();
        const admin = await createAdmin();
        await addToCart(user.token, product.id, 1);
        
        await request(app).delete(`/products/${product.id}`).set(bearer(admin.token));

        const res = await placeOrder(user.token);
        expect(res.status).toBe(409);
        expect(await prisma.order.count()).toBe(0);
        expect(await prisma.cartItem.count()).toBe(1);
    });
});