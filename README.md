# Sergi Tugas Art Studio

Artist portfolio, Art Mail Club and art shop. Built with Nuxt 4, TypeScript (strict) and Tailwind CSS v4.

## Requirements

- Node.js `^22.22.3 || ^24.15.0 || >=26` (see `.nvmrc`)
- npm

## Setup

```bash
npm install
cp .env.example .env   # optional for local dev
npm run dev            # http://localhost:3000
```

## Scripts

| Script                            | Purpose                                                |
| --------------------------------- | ------------------------------------------------------ |
| `npm run dev`                     | Dev server                                             |
| `npm run build`                   | Production build → `.output/`                          |
| `npm start`                       | Run the built server (`node .output/server/index.mjs`) |
| `npm run lint` / `lint:fix`       | ESLint                                                 |
| `npm run format` / `format:check` | Prettier                                               |
| `npm run typecheck`               | `vue-tsc` via `nuxt typecheck`                         |
| `npm test`                        | Vitest unit tests                                      |
| `npm run check`                   | Everything CI runs                                     |

## Docs

- [PROJECT_STATUS.md](PROJECT_STATUS.md): current phase, tasks, known issues
- [ARCHITECTURE.md](ARCHITECTURE.md): structure, hosting, decision log
- [SECURITY.md](SECURITY.md): security controls and roadmap
- [ASSET_GUIDELINES.md](ASSET_GUIDELINES.md): how the artist provides images and files
