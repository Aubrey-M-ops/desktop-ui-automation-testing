import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1, // avoid rate limit
  use: {
    baseURL: process.env.BASE_URL ?? 'https://takehome-desktop.d.tekvisionflow.com',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  reporter: [['html', { open: 'never' }]],
  timeout: 30000,
});
