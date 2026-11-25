/** Close the connection pool cleanly when the server shuts down. */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('close', async () => {
    await closeDatabase()
  })
})
