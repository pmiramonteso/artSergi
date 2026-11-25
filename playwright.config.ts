import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests against the PRODUCTION build (`npm run build` first).
 * Public pages work without a database (static content fallback), so the
 * suite needs no external services. Locally it uses the installed Edge
 * (no browser download); CI installs Chromium.
 */
const PORT = 3200
const channel = process.env.CI ? undefined : 'msedge'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
  ],
  webServer: {
    command: 'node .output/server/index.mjs',
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT), NUXT_PUBLIC_SITE_URL: `http://localhost:${PORT}` },
  },
})
