import { defineConfig } from '@playwright/test'

const baseURL = process.env.QA_BASE_URL ?? (process.env.QA_START_SERVER === 'true' ? 'http://127.0.0.1:5174/app/' : 'http://127.0.0.1:5174/app/')

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  outputDir: 'reports/test-results',
  reporter: [['list'], ['html', { outputFolder: 'reports/html', open: 'never' }], ['json', { outputFile: 'reports/results.json' }]],
  use: { baseURL, browserName: 'chromium', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  webServer: process.env.QA_START_SERVER === 'true' ? { command: 'npm run dev -- --host 127.0.0.1 --port 5174', url: baseURL, reuseExistingServer: !process.env.CI, timeout: 120_000 } : undefined,
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
})
