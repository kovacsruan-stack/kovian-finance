import { test, expect } from '@playwright/test'

const routes = ['/contas', '/transacoes', '/cartoes', '/orcamentos', '/metas', '/relatorios', '/recorrentes', '/categorias', '/configuracoes']

test('Finance core routes render without a 404 page', async ({ page }) => {
  for (const route of routes) {
    await page.goto(route)
    await expect(page.locator('body')).not.toContainText('404')
    await expect(page.locator('main')).toBeVisible()
  }
})

test('Finance command palette opens and closes with keyboard', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Control+K')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})


test('Finance ecosystem links are safe on local shell', async ({ page }) => {
  await page.goto('/')
  const links = page.locator('a[target="_blank"]')
  const count = await links.count()
  for (let index = 0; index < count; index += 1) {
    const href = await links.nth(index).getAttribute('href')
    expect(href).toMatch(/^https?:\\/\\/|^\\/)
  }
})
