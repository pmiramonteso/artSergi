import { defineConfig } from 'vitest/config'

// Plain Node environment for pure logic (shared/, server services).
// A Nuxt-aware environment (@nuxt/test-utils) will be added when
// component/integration tests are introduced.
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
})
