import "dotenv/config";
import argon2 from "argon2";
import { prisma } from "../src/lib/prisma";

async function main() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    if(!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");

    await prisma.user.upsert({
        where: { email: email.toLowerCase() },
        update: {},
        create: {
            email: email.toLowerCase(),
            passwordHash: await argon2.hash(password),
            role: "ADMIN",
            firstName: "Admin",
            lastName: "Admin",
            streetNum: "-",
            postalCode: "-",
            town: "-",
            country: "-",
        },
    });
    console.log("Admin ready:" , email);
    
};

main().finally(() => prisma.$disconnect());