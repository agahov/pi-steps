import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'match3-chromium', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4174' } },
  ],
  webServer: {
    command: 'npm run preview -w @pi-steps/match3',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
  },
});
