import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@nuxt/eslint'],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
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
    /** Newsletter provider id. Empty = sign-up not open yet (nothing stored). */
    newsletterProvider: '',
    /**
     * Trust X-Forwarded-For for the client IP (rate limiting). Enable ONLY when
     * the app runs behind a proxy that overwrites the header (cPanel/Cloudflare).
     */
    trustProxy: false,
    public: {
      /** Absolute site origin, e.g. https://example.com — set per environment. */
      siteUrl: '',
      siteName: 'Sergi Tugas Art Studio',
      /** Only `true` in the real production deployment. Previews stay noindex. */
      siteIndexable: false,
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
  },
})
