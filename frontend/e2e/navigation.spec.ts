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
