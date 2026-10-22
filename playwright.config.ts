import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    use: {
        baseURL: 'http://localhost:4201/',
    },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    ],
    webServer: {
        command: 'npm start',
        url: 'http://localhost:4201/',
        reuseExistingServer: true,
    },
});
