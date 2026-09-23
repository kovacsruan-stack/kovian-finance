import { test, expect } from '@playwright/test'

test('loads the Finance workspace shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/KOVIAN|Finance/i).first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText('404')
})
