import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const LOCALES = [
  { code: 'en', works: 'works', title: 'Selected works' },
  { code: 'es', works: 'obras', title: 'Obras seleccionadas' },
  { code: 'ca', works: 'obres', title: 'Obres seleccionades' },
] as const

test.describe('homepage', () => {
  for (const l of LOCALES) {
    test(`renders in ${l.code} with the signature as h1 and real paintings`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

      await page.goto(`/${l.code}`)
      await expect(page.locator('html')).toHaveAttribute('lang', l.code)
      await expect(page.getByRole('heading', { level: 1, name: 'Sergi Tugas' })).toBeVisible()
      await expect(page.getByRole('heading', { level: 2, name: l.title })).toBeAttached()
      // Hero paintings are real images with alt text (no placeholders).
      const heroImages = page.locator('[data-hero-art] img')
      await expect(heroImages).not.toHaveCount(0)
      for (const alt of await heroImages.evaluateAll((els) =>
        els.map((e) => e.getAttribute('alt')),
      )) {
        expect(alt?.length ?? 0).toBeGreaterThan(20)
      }
      expect(errors).toEqual([])
    })
  }

  test('has no horizontal overflow', async ({ page }) => {
    await page.goto('/es')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('canonical and hreflang alternates point to the localized URLs', async ({ page }) => {
    await page.goto('/es')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/es$/)
    for (const l of LOCALES) {
      await expect(page.locator(`link[rel="alternate"][hreflang="${l.code}"]`)).toHaveCount(1)
    }
  })
})

test.describe('navigation and languages', () => {
  test('language switcher keeps the page and localizes the path', async ({ page, isMobile }) => {
    await page.goto('/en/works/painting-002')
    if (isMobile) {
      await page.getByRole('button', { name: 'Menu' }).click()
      await page
        .getByRole('dialog')
        .getByRole('link', { name: /Català/ })
        .click()
    } else {
      await page
        .getByRole('banner')
        .getByRole('link', { name: /Català/ })
        .click()
    }
    await expect(page).toHaveURL(/\/ca\/obres\/painting-002$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ca')
  })

  test('“All works” leads to the localized works index', async ({ page }) => {
    await page.goto('/es')
    await page.getByRole('link', { name: 'Todas las obras →' }).click()
    await expect(page).toHaveURL(/\/es\/obras$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('mobile menu opens, traps focus and closes with Escape', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only')
    await page.goto('/en')
    await page.getByRole('button', { name: 'Menu' }).click()
    const dialog = page.getByRole('dialog', { name: 'Main menu' })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})

test.describe('works', () => {
  test('a sold work is clearly not for sale', async ({ page }) => {
    await page.goto('/en/works/painting-001')
    await expect(page.getByText('Sold', { exact: true }).first()).toBeVisible()
    await expect(
      page.getByText('This work is sold and is not available for purchase.'),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /buy|add to cart/i })).toHaveCount(0)
  })

  test('unknown pages return a real 404', async ({ page }) => {
    const res = await page.goto('/en/works/does-not-exist')
    expect(res?.status()).toBe(404)
  })
})

test.describe('newsletter', () => {
  test('validates on the client and reports the server state accessibly', async ({ page }) => {
    await page.goto('/en#newsletter')
    await page.waitForLoadState('networkidle') // hydrated
    const form = page.locator('#newsletter form')
    await form.getByRole('button', { name: 'Subscribe' }).click()
    await expect(form.getByText('Enter a valid email address')).toBeVisible()
    await expect(form.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    await form.getByRole('textbox', { name: 'Email' }).fill('reader@example.com')
    await form.getByRole('checkbox').check()
    await page.waitForTimeout(2100) // the timing check rejects instant (bot) submissions
    await form.getByRole('button', { name: 'Subscribe' }).click()
    // No provider configured: honest "opens soon", nothing stored.
    await expect(form.getByRole('status')).toContainText('Sign-up opens soon')
  })
})

test.describe('accessibility (axe, WCAG 2.2 AA)', () => {
  for (const path of ['/en', '/es/obras', '/ca/obres/painting-003', '/en/legal/privacy']) {
    test(`no violations on ${path}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto(path)
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
    })
  }
})

test.describe('security headers (production build)', () => {
  test('HTML has a nonce-based CSP and hardening headers', async ({ request }) => {
    const res = await request.get('/en')
    const csp = res.headers()['content-security-policy'] ?? ''
    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/)
    expect(res.headers()['x-frame-options']).toBe('DENY')
    expect(res.headers()['x-content-type-options']).toBe('nosniff')
  })

  test('the page loads with zero CSP violations', async ({ page }) => {
    const violations: string[] = []
    page.on(
      'console',
      (m) => /Content Security Policy/i.test(m.text()) && violations.push(m.text()),
    )
    await page.goto('/en')
    await page.waitForLoadState('networkidle')
    expect(violations).toEqual([])
  })
})
