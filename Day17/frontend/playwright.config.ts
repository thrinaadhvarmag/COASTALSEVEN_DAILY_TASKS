import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
    testDir: "./e2e",
    timeout: 30000,
    use: {
        baseURL: "http://localhost:5173",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ],
    webServer: {
        command: "npm run dev -- --host 0.0.0.0",
        url: "http://127.0.0.1:5173",
        reuseExistingServer: !process.env.CI,
    },
});
