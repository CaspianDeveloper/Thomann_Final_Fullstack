import { execSync } from "node:child_process";
import { config } from "dotenv";

export default function setup() {
    config({ path: ".env.test" , quiet: true });
    const url = process.env.DATABASE_URL ?? "";

    if (!url.includes("_test")) {
        throw new Error("Refusing to run: DATABASE_URL must point to a *_test database");
    };

    execSync("npx prisma  migrate deploy --config prisma7.config.ts" , {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: url },
    });
}; 

