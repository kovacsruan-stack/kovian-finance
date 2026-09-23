import { test, expect } from '@playwright/test'

test('entry route renders cleanly', async ({ page }) => {
  const consoleErrors:string[]=[]
  const failedRequests:string[]=[]
  page.on('console', m => { if(m.type()==='error') consoleErrors.push(m.text()) })
  page.on('requestfailed', r => failedRequests.push(r.url()))
  await page.goto('/', { waitUntil:'domcontentloaded' })
  await expect(page.locator('body')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/vite error|internal server error/i)
  expect(consoleErrors, consoleErrors.join('\\n')).toEqual([])
  expect(failedRequests, failedRequests.join('\\n')).toEqual([])
})

test('@a11y entry controls have accessible names', async ({ page }) => {
  await page.goto('/', { waitUntil:'domcontentloaded' })
  const unnamed=await page.locator('button').evaluateAll(bs=>bs.filter(b=>!(b.textContent??'').trim()&&!b.getAttribute('aria-label')&&!b.getAttribute('title')).length)
  expect(unnamed).toBe(0)
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)
  expect(overflow).toBe(false)
})


test('theme control changes document theme when available', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const button = page.locator('header button[aria-label*="modo" i], header button[aria-label*="mode" i], header button[aria-label*="light" i], header button[aria-label*="dark" i]').first()
  if (await button.count()) {
    const before = await page.locator('html').getAttribute('class')
    await button.click()
    const after = await page.locator('html').getAttribute('class')
    expect(after).not.toBe(before)
  }
})
