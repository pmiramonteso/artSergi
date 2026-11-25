import { defineConfig } from 'vitest/config'

/**
 * unit: pure logic (shared/, app/data, server utils), plain Node.
 * integration: real MySQL 8.4 (the production engine) with the real
 * migrations; each test file gets its own throwaway database.
 * Needs TEST_MYSQL_URL (see tests/integration/global-setup.ts).
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: { name: 'unit', include: ['tests/unit/**/*.test.ts'], environment: 'node' },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          globalSetup: ['tests/integration/global-setup.ts'],
          environment: 'node',
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
})
