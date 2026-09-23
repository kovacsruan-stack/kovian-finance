import { test, expect } from '@playwright/test'

test('local shell renders without a blank screen', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('/')
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('body')).toContainText(/finance|finan|dashboard|conta/i)
  expect(pageErrors).toEqual([])
})
