import { test, expect } from '@playwright/test'

const routes = ['/', '/transacoes', '/contas', '/cartoes', '/orcamentos', '/metas', '/relatorios', '/recorrentes', '/categorias', '/configuracoes']

for (const route of routes) {
  test(`route ${route} renders an application main`, async ({ page }) => {
    const pageErrors: string[] = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.goto(route)
    await expect(page.locator('#root')).not.toBeEmpty()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/GROUPS\.|skipToContent|professionalArea/)
    expect(pageErrors).toEqual([])
  })
}

test('search palette opens and closes with Escape', async ({ page }) => {
  await page.goto('/')
  const search = page.getByRole('button', { name: /search|pesquisar/i })
  await expect(search).toBeVisible()
  await search.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
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
