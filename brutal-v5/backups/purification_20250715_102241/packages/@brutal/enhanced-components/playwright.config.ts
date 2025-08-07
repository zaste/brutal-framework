import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://localhost:3334',
    // Use chromium which has fewer dependencies
    browserName: 'chromium',
    headless: true,
  },
  webServer: {
    command: 'vite',
    port: 3334,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  reporter: 'html',
});