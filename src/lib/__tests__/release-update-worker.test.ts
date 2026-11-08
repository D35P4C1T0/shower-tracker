import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

const source = readFileSync('public/release-update-sw.js', 'utf8')

function activateUpdate(active: object | null, windows: { url: string; navigate: ReturnType<typeof vi.fn> }[] = []) {
  let activate!: (event: { waitUntil: (work: Promise<void>) => void }) => void
  let completion: Promise<void> | undefined
  const clients = { claim: vi.fn().mockResolvedValue(undefined), matchAll: vi.fn().mockResolvedValue(windows) }
  runInNewContext(source, {
    self: {
      registration: { active, scope: 'https://example.com/shower-tracker/' },
      clients,
      addEventListener: (_type: string, handler: typeof activate) => { activate = handler },
    },
    console,
  })
  activate({ waitUntil: work => { completion = work } })
  return { clients, completion }
}

describe('release update worker', () => {
  it('does not reload a first installation', () => {
    const { clients, completion } = activateUpdate(null)
    expect(completion).toBeUndefined()
    expect(clients.claim).not.toHaveBeenCalled()
  })

  it('reloads existing app windows without blocking activation or navigating other apps', async () => {
    const app = { url: 'https://example.com/shower-tracker/?page=calendar', navigate: vi.fn(() => new Promise(() => {})) }
    const other = { url: 'https://example.com/another-app/', navigate: vi.fn() }
    const { clients, completion } = activateUpdate({}, [app, other])
    await completion
    expect(clients.claim).toHaveBeenCalledOnce()
    expect(app.navigate).toHaveBeenCalledWith(app.url)
    expect(other.navigate).not.toHaveBeenCalled()
  })
})
