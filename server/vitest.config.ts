import { defineConfig } from "vitest/config";
import { config } from "dotenv";

const parsed = config({ path: ".env.test" , quiet: true }).parsed ?? {};

export default defineConfig({
    test: {
        env: parsed,
        globalSetup: ["./tests/globalSetup.ts"],
        fileParallelism: false, // bütün fayllar eyni bazanı işlədir.
        testTimeout: 30000,
        hookTimeout: 60000,
    },
});

