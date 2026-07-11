self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || self.registration.scope
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existingWindow = windows.find((client) => new URL(client.url).origin === new URL(targetUrl).origin)

    if (existingWindow) {
      await existingWindow.focus()
      if ('navigate' in existingWindow) await existingWindow.navigate(targetUrl)
      return
    }

    await self.clients.openWindow(targetUrl)
  })())
})
