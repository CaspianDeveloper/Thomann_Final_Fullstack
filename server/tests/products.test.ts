import request from "supertest";
import { beforeEach , describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { bearer, createAdmin , makeProduct, resetDb } from "./helpers.js";

beforeEach(resetDb);

const rows = (b: any): any[] => b.items ?? b.data ?? b.products ?? [];
const names = (b: any) => rows(b).map((r) => r.name);

describe("GET /products: pagination, filter , sort" , () => {
    it("paginates without losing or repeating products" , async () => {
        for (let i = 1; i <= 5; i++) await makeProduct({ name: `P${i}` , price: i * 10 });

        const p1 = await request(app).get("/products?page=1&limit=2");
        const p2 = await request(app).get("/products?page=2&limit=2");
        const p3 = await request(app).get("/products?page=3&limit=2");
        expect(p1.status).toBe(200);
        expect(rows(p1.body)).toHaveLength(2);
        expect(rows(p2.body)).toHaveLength(2);
        expect(rows(p3.body)).toHaveLength(1);

        const all = [...names(p1.body), ...names(p2.body) , ...names(p3.body)];
        expect(new Set(all).size).toBe(5);
    });

    it("sorts by price and name" , async () => {
        await makeProduct({ name: "Alpha", price: 300 });
        await makeProduct({ name: "Bravo", price: 100 });
        await makeProduct({ name: "Charlie" , price: 200 });

        const asc = await request(app).get("/products?sort=price_asc");
        const desc = await request(app).get("/products?sort=price_desc");
        const byName = await request(app).get("/products?sort=name_asc");
        expect(names(asc.body)).toEqual(["Bravo", "Charlie" , "Alpha"]);
        expect(names(desc.body)).toEqual(["Alpha" , "Charlie" , "Bravo"]);
        expect(names(byName.body)).toEqual(["Alpha" , "Bravo" , "Charlie"]);
    });

    it("filters by brand" , async () => {
        await makeProduct({ name: "Strat", brand: "Fender" });
        await makeProduct({ name: "Piano", brand: "Yamaha" });

        const res = await request(app).get("/products?brand=Fender");
        expect(names(res.body)).toEqual(["Strat"]);
    });

    it("filters by category slug", async () => {
        await makeProduct({ name: "Strat", categorySlug: "guitars" });
        await makeProduct({ name: "Snare", categorySlug: "drums" });

        const res = await request(app).get("/products?category=guitars");
        expect(names(res.body)).toEqual(["Strat"]);
    });

    it("filters by price range" , async () => {
        await makeProduct({ name: "Alpha", price: 300 });
        await makeProduct({ name: "Bravo", price: 100 });
        await makeProduct({ name: "Charlie", price: 200 });

        const res = await request(app).get("/products?minPrice=150&maxPrice=250");
        expect(names(res.body)).toEqual(["Charlie"]);
    });

    it("searches by name" , async () => {
        await makeProduct({ name: "Fender Stratocaster" });
        await makeProduct({ name: "Yamaha Piano" });

        const res = await request(app).get("/products?search=Strat");
        expect(names(res.body)).toEqual(["Fender Stratocaster"]);
    });

    it("rejects invalid query parameters with 400", async () => {
        const tooMany = await request(app).get("/products?limit=1000");
        const badRange = await request(app).get("/products?minPrice=500&maxPrice=100");
        const badSort = await request(app).get("/products?sort=banana");
        expect(tooMany.status).toBe(400);
        expect(badRange.status).toBe(400);
        expect(badSort.status).toBe(400);
    });

    it("hides inactive products publicly but shows them to admin" , async () => {
        await makeProduct({ name: "Visible" });
        await makeProduct({ name: "Hidden", isActive: false });
        const admin = await createAdmin();

        const publicList = await request(app).get("/products");
        const adminList = await request(app).get("/admin/products").set(bearer(admin.token));
        expect(names(publicList.body)).toEqual(["Visible"]);
        expect(names(adminList.body).sort()).toEqual(["Hidden" , "Visible"]);
    });
});
