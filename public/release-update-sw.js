const updatingExistingApp = Boolean(self.registration.active)

self.addEventListener('activate', (event) => {
  if (!updatingExistingApp) return

  event.waitUntil((async () => {
    await self.clients.claim()
    const windows = await self.clients.matchAll({ type: 'window' })
    for (const client of windows) {
      if (!client.url.startsWith(self.registration.scope)) continue
      // Navigation can wait for activation, so do not await it inside activate.
      void client.navigate(client.url).catch(error => {
        console.warn('Could not refresh app after update', error)
      })
    }
  })())
})
