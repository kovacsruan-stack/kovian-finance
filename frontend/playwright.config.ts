import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.KOVIAN_FINANCE_QA_BASE_URL || 'http://127.0.0.1:5177/app/'
const localDevUrl = process.env.KOVIAN_FINANCE_QA_BASE_URL || 'http://127.0.0.1:5177/app/'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: ['../src/**/*.test.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 5177',
    url: localDevUrl,
    reuseExistingServer: true,
    timeout: 120000,
  },
})
