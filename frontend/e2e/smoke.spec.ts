import { test, expect } from '@playwright/test'

test('Finance local Chromium smoke', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })

  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', /.+/)
  await expect(page.locator('body')).not.toContainText('Cannot read properties')
  await expect(page.locator('body')).not.toContainText('Missing refresh token')
  expect(runtimeErrors, 'No uncaught browser runtime errors should occur during smoke QA').toEqual([])
  await expect(page.getByText(/KOVIAN|Finance/i).first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText('404')

})
