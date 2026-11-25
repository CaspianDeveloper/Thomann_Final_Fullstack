import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { PASSWORD, resetDb, validUser } from "./helpers";

beforeEach(resetDb);

describe("health" , () => {
    it("GET /health return Ok" , async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
    });
});

describe("auth (rule 8)" , () => {
    it("registers a USER and never returns passwordHash" , async () => {
        const res = await request(app).post("/auth/register").send(validUser());
        expect(res.status).toBe(201);
        expect(JSON.stringify(res.body)).not.toContain("passwordHash");

        const user = await prisma.user.findUniqueOrThrow({ where: { email: "user@test.com" }  });
        expect(user.role).toBe("USER");
    });

    it("rejects role in the body with 400 and creates no user" , async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({ ...validUser(), role: "ADMIN" });
        
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("VALIDATION_ERROR");
        expect(await prisma.user.count()).toBe(0);
    });

    it("rejects a duplicate email (case-insensitive) with 409" , async () => {
        await request(app).post("/auth/register").send(validUser("same@test.com"));
        const res = await request(app).post("/auth/register").send(validUser("SAME@test.com"));
        expect(res.status).toBe(409);
    });

    it("rejects a password shorter than 8 characters with 400" , async () => {
        const res = await request(app)
            .post("/auth/register")
            .send({ ...validUser(), password: "short" });
        expect(res.status).toBe(400);
    });

    it("gives the same 401 for a wrong password and an unknown email" , async () => {
        await request(app).post("/auth/register").send(validUser());
        const wrongPass  = await request(app).post("/auth/login").send({ email: "user@test.com", password: "wrong-password" });
        const unknown = await request(app).post("/auth/login").send({ email: "nobody@test.com", password: PASSWORD });
        expect(wrongPass.status).toBe(401);
        expect(unknown.status).toBe(401);
        expect(wrongPass.body).toEqual(unknown.body);
    });

    it("GET /auth/me without a token returns 401" , async () => {
        const res = await request(app).get("/auth/me");
        expect(res.status).toBe(401);
    });
});

