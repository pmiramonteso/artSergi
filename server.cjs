/**
 * Production entry for cPanel "Setup Node.js App" (Phusion Passenger), which
 * expects a CommonJS startup file. It loads the ESM Nitro server built in
 * .output/. Passenger provides the port; locally use `npm start` instead.
 */
import('./.output/server/index.mjs').catch((err) => {
  console.error(JSON.stringify({ level: 'fatal', msg: 'failed to start', error: String(err) }))
  process.exit(1)
})
