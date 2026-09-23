import { test, expect } from '@playwright/test'

test('local shell renders without a blank screen', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.goto('/')
  await expect(page.locator('#root')).not.toBeEmpty()
  await expect(page.locator('body')).toContainText(/finance|finan|dashboard|conta/i)
  expect(pageErrors).toEqual([])
})

test('language switcher changes between PT and EN', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: /change language|mudar idioma/i })
  await expect(trigger).toBeVisible()
  await trigger.click()
  await page.getByRole('menuitem', { name: 'English' }).click()
  await expect(trigger).toContainText('EN')
  await trigger.click()
  await page.getByRole('menuitem', { name: /Português/ }).click()
  await expect(trigger).toContainText('PT')
})
