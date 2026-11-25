import { defineConfig } from 'vitest/config'

/**
 * unit: pure logic (shared/, app/data, server utils), plain Node.
 * integration: real PostgreSQL semantics via PGlite (in-memory Postgres
 * compiled to WASM) with the real migrations: no Docker or server needed.
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
          environment: 'node',
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
})
