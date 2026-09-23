import { test, expect } from '@playwright/test'

test('Finance local Chromium smoke', async ({ page }) => {
  const runtimeErrors: string[] = []
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`)
  })
  page.on('response', response => {
    if (response.status() >= 500) runtimeErrors.push(`http ${response.status()}: ${response.url()}`)
  })
  page.on('requestfailed', request => {
    runtimeErrors.push(`requestfailed: ${request.url()} — ${request.failure()?.errorText ?? 'unknown'}`)
  })

  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', /.+/)
  await expect(page.locator('body')).not.toContainText('Cannot read properties')
  await expect(page.locator('body')).not.toContainText('Missing refresh token')
  expect(runtimeErrors, 'No uncaught browser runtime errors should occur during smoke QA').toEqual([])
  await page.getByRole('button', { name: /change language/i }).click()
  await expect(page.getByRole('menuitem', { name: 'English' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'English' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.getByRole('button', { name: /change language/i }).click()
  await page.getByRole('menuitem', { name: 'Português' }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR')

  await expect(page.getByText(/KOVIAN|Finance/i).first()).toBeVisible()
  await expect(page.locator('body')).not.toContainText('404')

})
