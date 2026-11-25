import { cpSync } from 'node:fs'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { DEFAULT_LOCALE, LOCALES, LOCALIZED_PAGES } from './shared/constants/i18n'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@nuxt/eslint', '@nuxtjs/i18n'],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      titleTemplate: '%s · Sergi Tugas',
      title: 'Art Studio',
    },
  },

  /**
   * Runtime configuration.
   * Every value here can be overridden at runtime with NUXT_* environment
   * variables (see .env.example). Nothing domain-specific is hardcoded.
   * Keys outside `public` are server-only and never reach the browser.
   */
  runtimeConfig: {
    /**
     * PostgreSQL connection string (server-only). Empty = no database: the
     * public site serves the static content in app/data.
     */
    databaseUrl: '',
    /** Newsletter provider id. Empty = sign-up not open yet (nothing stored). */
    newsletterProvider: '',
    /**
     * Header with the real client IP set by OUR proxy, for rate limiting:
     * '' (TCP peer, default) | 'cf-connecting-ip' | 'x-real-ip' | 'x-forwarded-for'
     * (last hop only). See shared/utils/client-ip.ts.
     */
    clientIpHeader: '',
    /**
     * Commerce: 'off' (default) | 'test' | 'live'. See shared/domain/commerce.ts:
     * live additionally requires live keys AND validated pricing.
     */
    commerceMode: 'off',
    stripeSecretKey: '',
    stripeWebhookSecret: '',
    /** Better Auth secret (≥ 32 random chars). Empty = accounts disabled. */
    authSecret: '',
    /** SMTP connection URL for transactional email (verification, reset). */
    smtpUrl: '',
    mailFrom: 'Sergi Tugas Art Studio <no-reply@localhost>',
    /** Comma-separated emails allowed to become admin (with verified email + 2FA). */
    adminEmails: '',
    /** Apply DB migrations at startup (deploys only; see server/plugins/migrate-on-start.ts). */
    dbMigrateOnStart: false,
    /** ISO countries offered at checkout (provisional, OPEN_QUESTIONS B3). */
    shippingCountries: 'ES',
    public: {
      /** Absolute site origin, e.g. https://example.com — set per environment. */
      siteUrl: '',
      siteName: 'Sergi Tugas Art Studio',
      /** Only `true` in the real production deployment. Previews stay noindex. */
      siteIndexable: false,
      /** Mirrors the server commerce mode for UI hints (no secrets). */
      commerceMode: 'off',
    },
  },

  /**
   * Multilingual routing: /en/, /es/, /ca/ (prefix strategy, no unprefixed
   * duplicates). Locale list, default and localized paths live in
   * shared/constants/i18n.ts. The absolute base URL for canonical/hreflang
   * comes from NUXT_PUBLIC_SITE_URL at runtime (see app/plugins/i18n-base-url.ts).
   */
  i18n: {
    strategy: 'prefix',
    defaultLocale: DEFAULT_LOCALE,
    locales: LOCALES.map(({ code, language, name, file }) => ({ code, language, name, file })),
    langDir: 'locales',
    customRoutes: 'config',
    pages: {
      ...LOCALIZED_PAGES,
      // Internal reference page: not localized, not indexed.
      'design-system': false,
      // Admin area: English only, not localized, never indexed.
      admin: false,
    },
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
      fallbackLocale: DEFAULT_LOCALE,
    },
  },

  /** Public assets keep stable names: cache for a week, revalidate in the background. */
  routeRules: {
    '/images/**': {
      headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=86400' },
    },
    '/illustrations/**': {
      headers: { 'cache-control': 'public, max-age=604800, stale-while-revalidate=86400' },
    },
    '/og/**': { headers: { 'cache-control': 'public, max-age=604800' } },
  },

  hooks: {
    /**
     * Ship SQL migrations with the server bundle (for opt-in migrate-on-start).
     * Registered with nitro.hooks.hook() so it ADDS to the deployment preset's
     * own 'compiled' hook. Declaring nitro.hooks.compiled in the config would
     * REPLACE it, and the Vercel preset uses that hook to write
     * .vercel/output/config.json (deploys failed without it).
     */
    'nitro:init'(nitro) {
      nitro.hooks.hook('compiled', () => {
        cpSync('server/database/migrations', join(nitro.options.output.serverDir, 'migrations'), {
          recursive: true,
        })
      })
    },
  },

  typescript: {
    strict: true,
    typeCheck: false, // run explicitly via `npm run typecheck` (keeps dev server fast)
  },

  eslint: {
    config: {
      stylistic: false, // formatting is owned by Prettier
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  nitro: {
    // Default `node-server` preset: a plain Node.js server (`.output/server/index.mjs`),
    // compatible with cPanel's Node.js Application Manager. Vercel previews
    // auto-detect the `vercel` preset through the VERCEL env var.
    compressPublicAssets: true,
    experimental: { tasks: true },
    // Return stock from abandoned checkouts. Not on Vercel previews (cron limits; no DB there).
    scheduledTasks: process.env.VERCEL ? {} : { '*/5 * * * *': ['inventory:expire'] },
  },
})
