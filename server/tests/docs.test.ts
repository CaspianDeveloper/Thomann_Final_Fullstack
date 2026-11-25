import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("OpenAPI docs" , () => {
    it("serves Swagger UI at /docs" , async () => {
        const res = await request(app).get("/docs/");
        expect(res.status).toBe(200);
        expect(res.text.toLowerCase()).toContain("swagger");
    });

    it("serves an OpenAPI document that lists the main endpoints" , async () => {
        const res = await request(app).get("/openapi.json");
        expect(res.status).toBe(200);
        expect(res.body.openapi).toMatch(/^3\./);
        for (const path of ["/auth/login" , "/products" , "/cart/items" , "/orders" , "/admin/orders/{id}/status"]) {
            expect(res.body.paths[path]).toBeDefined();
        };

        expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
    })
})