import { test, expect } from '@playwright/test'

const routes = ['/', '/contas', '/transacoes', '/calendario', '/gestao', '/transferencias', '/cartoes', '/orcamentos', '/metas', '/relatorios', '/recorrentes', '/categorias', '/configuracoes', '/previsao', '/patrimonio', '/inteligencia', '/dividas', '/notificacoes', '/import-export']

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


test('Finance command palette restores focus to its trigger', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: /search|pesquisar/i }).first()
  await trigger.click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
})


test('Finance expanded routes expose their page heading', async ({ page }) => {
  const routesWithExpectedText: Array<[string, RegExp]> = [
    ['/transferencias', /transfer/i],
    ['/previsao', /previs/i],
    ['/patrimonio', /patrim|net worth/i],
    ['/inteligencia', /intelig|intelligence/i],
    ['/dividas', /d[ií]vid|debt/i],
    ['/notificacoes', /notifica|notification/i],
  ]
  for (const [route, heading] of routesWithExpectedText) {
    await page.goto(route)
    await expect(page.locator('main h1')).toContainText(heading)
  }
})

test('primary navigation stays focused on five daily destinations', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Navegação principal' })
  for (const label of [/Visão geral|Overview/i, /Transações|Transactions/i, /Contas|Accounts/i, /Calendário|Financial calendar/i, /Gestão|Management/i]) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible()
  }
  await expect(nav.getByRole('link')).toHaveCount(5)
})

test('secondary navigation contains settings without expanding the main menu', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Navegação principal' })
  await nav.getByRole('button', { name: /Mais|More/i }).click()
  await expect(nav.getByRole('link', { name: /Configurações|Settings/i })).toBeVisible()
})

test('lessons are scheduled from the calendar, not duplicated in management tabs', async ({ page }) => {
  await page.goto('/gestao')
  const tabs = page.getByRole('tablist', { name: 'Seções de Gestão' })
  await expect(tabs.getByRole('tab', { name: 'Aulas' })).toHaveCount(0)
  await page.goto('/calendario')
  await expect(page.getByRole('heading', { name: /Aulas|Lessons/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /Agendar aula|Schedule lesson/i })).toBeVisible()
})
